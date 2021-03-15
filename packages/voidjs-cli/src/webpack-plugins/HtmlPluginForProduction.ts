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

import { Compilation, Compiler } from 'webpack'
import path from 'path'
import fs from 'fs-extra'
import webpack from 'webpack'
import prettier from 'prettier'

/**
 * html plugin for webpack
 */
const PluginName = 'HtmlPlugin'
export default class HtmlPlugin {
  #outputPath: string
  #pretty: boolean
  constructor(outputPath: string, pretty = false) {
    this.#outputPath = outputPath
    this.#pretty = pretty
  }
  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap(
      PluginName,
      (compilation: Compilation) => {
        const publicPath = compilation.outputOptions.publicPath

        const getAssetPath = (css: string) => {
          return publicPath + css
        }
        compilation.hooks.processAdditionalAssets.tapAsync(
          {
            name: PluginName,
            stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
          },
          (_, callback) => {
            const entrypoints = {}

            for (const [key, entrypoint] of compilation.entrypoints) {
              entrypoints[key] = entrypoint.getFiles()
            }

            const promises: Promise<void>[] = []
            for (const key in entrypoints) {
              const template = path.join(this.#outputPath, `${key}.html`)
              const html = fs.readFileSync(template, 'utf8')

              // will have one or more .js files, may have a .css file
              const files = entrypoints[key]
              const js: string[] = files.filter((file: string) =>
                file.endsWith('.js')
              )

              // might have vendor
              const vendor: string | undefined = js.filter((file: string) =>
                file.startsWith('vendor.')
              )[0]

              // other js
              const other: string = js.filter(
                (file: string) => !file.startsWith('vendor.')
              )[0]
              const clientJs =
                typeof vendor !== 'undefined' ? [vendor, other] : [other]

              const css = files.filter((file: string) =>
                file.endsWith('.css')
              )[0]

              let newHtml = html.replace(
                `<!-- preloadVoidJsClientScript -->`,
                clientJs
                  .map(
                    (js) =>
                      `<link rel="preload" href="${getAssetPath(
                        js
                      )}" as="script" />`
                  )
                  .join('')
              )

              newHtml = newHtml.replace(
                `<!-- loadVoidJsClientJs -->`,
                clientJs
                  .map((js) => `<script src="${getAssetPath(js)}"></script>`)
                  .join('')
              )
              newHtml = newHtml.replace(
                `<!-- preloadVoidJsClientStyle -->`,
                css
                  ? `<link rel="preload" href="${getAssetPath(
                      css
                    )}" as="style" />`
                  : ''
              )
              newHtml = newHtml.replace(
                `<!-- loadVoidJsClientStyle -->`,
                css
                  ? `<link rel="stylesheet" href="${getAssetPath(css)}" />`
                  : ''
              )
              if (this.#pretty === true) {
                newHtml = prettier.format(newHtml, {
                  parser: 'html',
                })
              }
              // we can't let webpack handle it
              // we want to control the output path of html ourself
              // compilation.emitAsset(
              //   `${key}.html`,
              //   new webpack.sources.RawSource(newHtml)
              // )
              promises.push(
                fs.outputFile(
                  path.join(this.#outputPath, key + '.html'),
                  newHtml
                )
              )
            }
            Promise.all(promises).then(() => callback(null), callback)
          }
        )
      }
    )
  }
}
