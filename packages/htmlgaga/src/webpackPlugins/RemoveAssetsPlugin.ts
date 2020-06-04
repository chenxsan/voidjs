/**
 * Copyright 2020-present, Sam Chen.
 * 
 * Licensed under GPL-3.0-or-later
 * 
 * This file is part of htmlgaga.

    htmlgaga is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    htmlgaga is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with htmlgaga.  If not, see <https://www.gnu.org/licenses/>.
 */
/**
 * Warn: should be put after htmlwebpackplugin when removing html
 */

import webpack from 'webpack'
interface Filter {
  (filename: string): boolean
}
interface Callback {
  (filename: string): void
}
const NAME = 'RemoveAssetsPlugin'
export default class RemoveAssetsPlugin {
  filter: Filter
  callback?: Callback
  constructor(filter: Filter, callback?: Callback) {
    this.filter = filter
    this.callback = callback
  }
  apply(compiler: webpack.Compiler): void {
    compiler.hooks.emit.tap(NAME, (compilation) => {
      compilation.hooks.processAssets.tap(NAME, (assets) => {
        Object.keys(assets).forEach((filename) => {
          if (this.filter(filename)) {
            delete assets[filename]
            if (this.callback) this.callback(filename)
          }
        })
      })
    })
  }
}
