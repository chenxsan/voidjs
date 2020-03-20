import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { clientHtmlFilename } from '../config'
export default class Inspector {
  static bodyTags
  static headTags
  options
  constructor(options) {
    this.options = options
  }
  apply(compiler: webpack.Compiler): void {
    if (this.options.name === 'client') {
      compiler.hooks.compilation.tap('Inspector', compilation => {
        HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
          'Inspector',
          (htmlPluginData, callback) => {
            Inspector.headTags = htmlPluginData.headTags // save for next
            Inspector.bodyTags = htmlPluginData.bodyTags // save for next
            callback(null, htmlPluginData)
          }
        )
      })
      compiler.hooks.emit.tap('Inspector', compilation => {
        delete compilation.assets[clientHtmlFilename]
      })
    }
  }
}
