import fs from 'fs-extra'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path'
import { cacheRoot } from '../config'
export default class PersistDataPlugin {
  static PluginName = 'PersistDataPlugin'
  apply(compiler: webpack.Compiler): void {
    compiler.hooks.compilation.tap(
      PersistDataPlugin.PluginName,
      compilation => {
        // we need to persist some data in htmlPluginData for next usage
        HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
          PersistDataPlugin.PluginName,
          (htmlPluginData, callback) => {
            fs.outputJSON(
              path.join(
                cacheRoot,
                `${htmlPluginData.outputName.replace(/\.html$/, '')}.json`
              ),
              {
                headTags: htmlPluginData.headTags,
                bodyTags: htmlPluginData.bodyTags
              },
              () => {
                callback(null, htmlPluginData)
              }
            )
          }
        )
      }
    )
  }
}
