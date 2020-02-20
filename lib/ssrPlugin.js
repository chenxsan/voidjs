/**
 * htmlgaga - Manage your html templates & their static assets better for any server-side languages.
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
const React = require('react')
const ReactDOMServer = require('react-dom/server')
const prettier = require('prettier')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { htmlTagObjectToString } = require('html-webpack-plugin/lib/html-tags')
function requireFromString(src, filename) {
  var Module = module.constructor
  var m = new Module()
  m._compile(src, filename)
  return m.exports
}

const mainRegexp = /^main\..*\.js$/
class SsrPlugin {
  constructor(options) {
    this.options = options
  }
  apply(compiler) {
    compiler.hooks.compilation.tap('SsrPlugin', compilation => {
      HtmlWebpackPlugin.getHooks(compilation).beforeAssetTagGeneration.tapAsync(
        'SsrPlugin',
        (data, next) => {
          const jsAssets = data.assets.js.filter(js => !mainRegexp.test(js))
          const cssAssets = data.assets.css
          this.assetsMap = [...jsAssets, ...cssAssets].reduce((acc, cur) => {
            const splits = cur.split('.')
            acc[splits[0] + '.' + splits[2]] = cur
            return acc
          }, {})
          next(null, data)
        }
      )
      HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
        'SsrPlugin',
        (data, next) => {
          // save for later use
          this.headTags = data.headTags
          this.bodyTags = data.bodyTags
          next(null, data)
        }
      )
    })
    compiler.hooks.emit.tapAsync('SsrPlugin', (compilation, next) => {
      for (let filename in compilation.assets) {
        if (mainRegexp.test(filename)) {
          // server side render
          const Page = requireFromString(
            compilation.assets[filename].source(),
            filename
          ).default
          const ssr = ReactDOMServer.renderToStaticMarkup(
            React.createElement(Page)
          )
          const hd = (this.headTags || [])
            .map(tag => htmlTagObjectToString(tag, true))
            .join('')
          const bd = (this.bodyTags || [])
            .filter(tag => {
              return !(
                tag.tagName === 'script' && mainRegexp.test(tag.attributes.src)
              )
            })
            .map(tag => htmlTagObjectToString(tag, true))
            .join('')
          // format html with prettier
          const body = prettier.format(
            `<!DOCTYPE html>
            <html lang="en">
              <head>
                ${hd}
                <title></title>
              </head>
              <body>
                ${ssr}
                ${bd}
              </body>
            </html>
            `,
            {
              parser: 'html'
            }
          )
          compilation.assets['index.html'] = {
            source: () => body,
            size: () => body.length
          }
          delete compilation.assets[filename]
        }
        compilation.assets['assetsMap.json'] = {
          source: () => JSON.stringify(this.assetsMap),
          size: () => this.assetsMap.length
        }
      }

      next()
    })
  }
}
module.exports = SsrPlugin
