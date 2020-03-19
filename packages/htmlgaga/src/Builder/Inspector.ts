import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
export default class Inspector {
  static data
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
            Inspector.data = htmlPluginData.bodyTags // save for next
            callback(null, htmlPluginData)
          }
        )
      })
    }
  }
}