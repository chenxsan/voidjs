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
      }

      next()
    })
  }
}
module.exports = SsrPlugin
