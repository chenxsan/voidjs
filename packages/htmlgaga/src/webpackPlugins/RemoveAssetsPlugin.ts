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
    compiler.hooks.emit.tap(NAME, compilation => {
      Object.keys(compilation.assets).forEach(filename => {
        if (this.filter(filename)) {
          delete compilation.assets[filename]
          if (this.callback) this.callback(filename)
        }
      })
    })
  }
}
