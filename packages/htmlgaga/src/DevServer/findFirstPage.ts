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
import path from 'path'

function getName(page: string): string {
  const { name } = path.parse(page)
  return name
}

function isIndex(page: string): boolean {
  return getName(page) === 'index'
}

function sort(pathA: string, pathB: string): number {
  return pathA.split(path.sep).length - pathB.split(path.sep).length
}

export default function findFirstPage(pages: string[]): string {
  const indexPages = pages.filter(isIndex).sort(sort)
  const nonIndexPages = pages.filter(page => !isIndex(page)).sort(sort)

  return indexPages.length > 0 ? indexPages[0] : nonIndexPages[0]
}
