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
 * html plugin for webpack
 */
import webpack from 'webpack'
import { Compilation, Compiler } from 'webpack'
import deriveEntryKeyFromRelativePath from '../DevServer/deriveEntryKeyFromRelativePath'
import deriveFilenameFromRelativePath from '../DevServer/deriveFilenameFromRelativePath'
import hasClientEntry, { ClientEntry } from '../DevServer/hasClientEntry'
const html = (pagesDir: string, pagePath: string, { title = '' } = {}) => {
  // 0. TODO do we need to split vendors?
  // 1. load server-side.js
  // 2. load client-side.js
  const serverEntry = deriveEntryKeyFromRelativePath(pagesDir, pagePath)
  const client: ClientEntry = hasClientEntry(pagePath)
  let clientEntry = ''
  if (client.exists) {
    clientEntry = deriveEntryKeyFromRelativePath(
      pagesDir,
      client.clientEntry as string
    )
  }
  const clientScript = `<script src="/${clientEntry}.js"></script>`
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
    </head>
    <body>
        <div id="voidjs-app"></div>
        <script src="/${serverEntry}.js"></script>
        ${client.exists === true ? clientScript : ''}
    </body>
    </html>
    `
}
const name = 'html'
export default class HtmlPlugin {
  #pagesDir: string
  #pagePath: string
  constructor(pagesDir: string, pagePath: string) {
    this.#pagesDir = pagesDir
    this.#pagePath = pagePath
  }
  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap(name, (compilation: Compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: name,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          compilation.emitAsset(
            deriveFilenameFromRelativePath(this.#pagesDir, this.#pagePath),
            new webpack.sources.RawSource(html(this.#pagesDir, this.#pagePath))
          )
        }
      )
    })
  }
}
