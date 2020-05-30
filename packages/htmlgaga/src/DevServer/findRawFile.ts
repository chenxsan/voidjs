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
import { join } from 'path'
import fs from 'fs-extra'
import { exts } from '../ProdBuilder/index'
export default function findRawFile(
  sourceDir: string,
  url: string,
  extList = exts.split(',')
): {
  src?: string
  exists: boolean
} {
  // normalize url
  if (url.endsWith('/')) url = url + '/index.html'

  // return the first one matched
  // so orders in exts matter
  for (let i = 0; i < extList.length; i++) {
    const searchExt = extList[i]
    const rawFilePath = join(sourceDir, url.replace(/\.html$/, `.${searchExt}`))
    if (fs.existsSync(rawFilePath)) {
      return {
        src: rawFilePath,
        exists: true,
      }
    }
  }

  return {
    exists: false,
  }
}
