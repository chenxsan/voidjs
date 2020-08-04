/**
 * Copyright 2020-present, Sam Chen.
 * 
 * Licensed under GPL-3.0-or-later
 * 
 * This file is part of voidjs.

    voidjs is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    voidjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with voidjs.  If not, see <https://www.gnu.org/licenses/>.
 */
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
        // @ts-ignore
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
