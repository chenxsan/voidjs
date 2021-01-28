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

/**
 * this plugin works only on webpack 5
 * so far it's used internally in voidjs
 */
// TODO needs test
import { Compiler, Compilation, AssetInfo, sources } from 'webpack'
const name = 'webpack-assets-map'
function removeHashFromFilename(name: string, info: AssetInfo) {
  if (info.contenthash) {
    name = name.replace(`.${info.contenthash}`, '')
  }
  if (info.fullhash) {
    name = name.replace(`.${info.fullhash}`, '')
  }
  if (info.modulehash) {
    name = name.replace(`.${info.modulehash}`, '')
  }
  if (info.chunkhash) {
    name = name.replace(`.${info.chunkhash}`, '')
  }
  return name
}
interface Mapping {
  [key: string]: string
}
class WebpackAssetsMap {
  #filename: string
  constructor(filename = 'assets.json') {
    this.#filename = filename
  }
  apply(compiler: Compiler): void {
    const assetsMap: Mapping = {}
    compiler.hooks.thisCompilation.tap(name, (compilation: Compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name,
          // I'm not very sure about this stage
          stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
        },
        () => {
          // mapping asset's name to its sourceFilename
          const assets = compilation
            .getAssets()
            .filter((asset) => typeof asset.info.development === 'undefined')
            .filter(
              (asset) => typeof asset.info.hotModuleReplacement === 'undefined'
            )
            .map((asset) => ({
              name: asset.name,
              info: {
                ...asset.info,
                // we care only about the sourceFilename
                sourceFilename:
                  asset.info.sourceFilename ??
                  removeHashFromFilename(asset.name, asset.info),
              },
            }))
            .reduce((acc, cur) => {
              acc[cur.name] = {
                sourceFilename: cur.info.sourceFilename,
              }
              return acc
            }, {})
          // see https://github.com/webpack/webpack/issues/11425#issuecomment-698837871
          for (const [, chunkGroup] of compilation.namedChunkGroups) {
            for (const chunk of chunkGroup.chunks) {
              const files = [
                ...Array.from(chunk.files),
                ...Array.from(chunk.auxiliaryFiles),
              ]
              files.reduce((acc, file) => {
                const sourceFilename = assets[file].sourceFilename
                acc[sourceFilename] = file
                return acc
              }, assetsMap)
            }
          }

          // we need entrypoints data for server side rendering
          const entrypoints = {}

          for (const [key, entrypoint] of compilation.entrypoints) {
            entrypoints[key] = entrypoint.getFiles()
          }

          compilation.emitAsset(
            this.#filename,
            new sources.RawSource(
              JSON.stringify(
                {
                  files: assetsMap,
                  entrypoints,
                },
                null,
                2
              )
            )
          )
        }
      )
    })
  }
}
export default WebpackAssetsMap
