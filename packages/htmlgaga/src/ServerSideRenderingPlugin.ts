/**
 * htmlgaga - Manage multiple non-SPA pages with webpack and React.js.
 * 
    Copyright (C) 2020-present  Sam Chen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import * as React from 'react'
import ReactDOMServer from 'react-dom/server'
import prettier from 'prettier'
import * as path from 'path'
import HtmlWebpackPlugin, { HtmlTagObject } from 'html-webpack-plugin'
import HtmlTags from 'html-webpack-plugin/lib/html-tags'
const { htmlTagObjectToString } = HtmlTags
import requireFromString from './requireFromString'

const PLUGIN_NAME = 'SsrPlugin'

interface Options {
  html: {
    lang: string
    pretty: boolean
  }
}

interface Tags {
  [propName: string]: HtmlTagObject[]
}
class SsrPlugin {
  options: Options
  headTags: Tags
  bodyTags: Tags
  constructor(options: Options) {
    this.options = options
    this.headTags = {} as Tags
    this.bodyTags = {} as Tags
  }
  apply(compiler): void {
    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
        PLUGIN_NAME,
        (htmlPluginData, next) => {
          // save for later use
          this.headTags[htmlPluginData.outputName] = htmlPluginData.headTags
          this.bodyTags[htmlPluginData.outputName] = htmlPluginData.bodyTags
          next(null, htmlPluginData)
        }
      )
    })
    compiler.hooks.emit.tapAsync(PLUGIN_NAME, (compilation, next) => {
      const htmls = Object.keys(this.options.outputMapInput)

      for (const filename in compilation.assets) {
        // throw html htmlwebpackplugin created
        // we would rather create it ourself
        if (htmls.indexOf(filename) !== -1) {
          const entryJs = this.options.outputMapInput[filename]
          const Page = requireFromString(
            compilation.assets[entryJs].source(),
            entryJs
          ).default
          const ssr = ReactDOMServer.renderToStaticMarkup(
            React.createElement(Page)
          )

          const preloadStyles = this.headTags[filename]
            .filter(tag => tag.tagName === 'link')
            .map(tag => {
              return `<link rel="preload" href="${tag.attributes.href}" as="${
                tag.attributes.rel === 'stylesheet' ? 'style' : ''
              }" />`
            })
            .join('')

          const hd = this.headTags[filename]
            .map(tag => htmlTagObjectToString(tag, true))
            .join('')

          const bodyTags: HtmlTagObject[] = this.bodyTags[filename].filter(
            tag => {
              return !(
                (
                  tag.tagName === 'script' &&
                  Object.values(this.options.outputMapInput).indexOf(
                    tag.attributes.src
                  ) !== -1
                ) // exclude entryJs from bodyTags
              )
            }
          )

          const preloadScripts = bodyTags
            .filter(tag => tag.tagName === 'script')
            .map(tag => {
              return `<link rel="preload" href="${tag.attributes.src}" as="script" />`
            })
            .join('')

          const bd = bodyTags
            .map(tag => htmlTagObjectToString(tag, true))
            .join('')

          let body = `<!DOCTYPE html><html lang="${this.options.html.lang}"><head>${preloadStyles}${preloadScripts}${hd}<title></title></head><body>${ssr}${bd}</body></html>
          `
          // format html with prettier
          if (this.options.html.pretty) {
            body = prettier.format(body, {
              parser: 'html'
            })
          }
          delete compilation.assets[filename]
          compilation.assets[filename.split(path.sep).join('-')] = {
            source: (): string => body,
            size: (): number => body.length
          }
          // remove entryJs
          delete compilation.assets[entryJs]
        }
      }

      next()
    })
  }
}
export default SsrPlugin
