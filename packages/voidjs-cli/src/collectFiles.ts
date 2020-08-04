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
import * as fs from 'fs'
import * as path from 'path'
import { cwd } from './config'

interface FilterFunc {
  (path: string): boolean
}

const doNotFilter = (): boolean => true

// returns an array of all pages' absolute path
async function collect(
  root: string = cwd,
  filter: FilterFunc = doNotFilter,
  acc: string[] = []
): Promise<string[]> {
  const files = await fs.promises.readdir(root)
  for (const file of files) {
    const filePath = path.resolve(root, file)
    const stats = await fs.promises.stat(filePath)
    if (stats.isFile()) {
      const f = filePath
      if (filter(f)) {
        acc.push(f)
      }
    } else if (stats.isDirectory()) {
      await collect(filePath, filter, acc)
    }
  }
  return acc
}
export default collect
