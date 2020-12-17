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
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
const PLUGIN_NAME = 'InjectGlobalScripts'
export default class InjectGlobalScriptsPlugin {
  scripts: string[]
  constructor(scripts: string[]) {
    this.scripts = scripts
  }
  apply(compiler: webpack.Compiler): void {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
        PLUGIN_NAME,
        (htmlPluginData, callback) => {
          const globalScripts: HtmlWebpackPlugin.HtmlTagObject[] = this.scripts.map(
            (script: string) => ({
              tagName: 'script',
              voidTag: false,
              attributes: {
                src: script,
              },
            })
          )
          callback(null, {
            ...htmlPluginData,
            headTags: htmlPluginData.headTags.concat(globalScripts),
          })
        }
      )
    })
  }
}
