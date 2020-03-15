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
import merge from 'deepmerge'

const PLUGIN_NAME = 'SsrPlugin'

interface Options {
  html: {
    lang: string
    pretty: boolean
    preload: {
      script: boolean
      style: boolean
    }
  }
}

interface Tags {
  [propName: string]: HtmlTagObject[]
}

function getMetaTags(meta) {
  const metaTagAttributeObjects = Object.keys(meta)
    .map(metaName => {
      const metaTagContent = meta[metaName]
      return Object.prototype.toString
        .call(metaTagContent)
        .slice(8, -1)
        .toLowerCase() === 'string'
        ? {
            name: metaName,
            content: metaTagContent
          }
        : metaTagContent
    })
    .filter(attribute => attribute !== false)
  return metaTagAttributeObjects.map(metaTagAttributes => {
    if (metaTagAttributes === false) {
      throw new Error('Invalid meta tag')
    }
    return {
      tagName: 'meta',
      voidTag: true,
      attributes: metaTagAttributes
    }
  })
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
          const mod = requireFromString(
            compilation.assets[entryJs].source(),
            entryJs
          )
          const Page = mod.default
          const pageTitle = mod.head?.title ?? ''
          const defaultMeta = {
            'utf-8': {
              charset: 'utf-8'
            },
            viewport:
              'width=device-width, initial-scale=1.0, viewport-fit=cover',
            generator: 'htmlgaga'
          }
          const pageMeta = merge(defaultMeta, mod.head?.meta ?? {})

          const meta = getMetaTags(pageMeta).map(tag => htmlTagObjectToString(tag, true)).join('')

          const ssr = ReactDOMServer.renderToStaticMarkup(
            React.createElement(Page)
          )

          let preloadStyles = ''

          if (this.options.html.preload.style) {
            preloadStyles = this.headTags[filename]
              .filter(tag => tag.tagName === 'link')
              .map(tag => {
                return `<link rel="preload" href="${tag.attributes.href}" as="${
                  tag.attributes.rel === 'stylesheet' ? 'style' : ''
                }" />`
              })
              .join('')
          }

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

          let preloadScripts = ''

          if (this.options.html.preload.script) {
            preloadScripts = bodyTags
              .filter(tag => tag.tagName === 'script')
              .map(tag => {
                return `<link rel="preload" href="${tag.attributes.src}" as="script" />`
              })
              .join('')
          }

          const bd = bodyTags
            .map(tag => htmlTagObjectToString(tag, true))
            .join('')

          let body = `<!DOCTYPE html><html lang="${this.options.html.lang}"><head><title>${pageTitle}</title>${meta}${preloadStyles}${preloadScripts}${hd}</head><body>${ssr}${bd}</body></html>
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
