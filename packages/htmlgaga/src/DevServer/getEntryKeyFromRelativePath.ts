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
import * as path from 'path'
export default function getEntryKeyFromRelativePath(
  from: string,
  to: string
): string {
  const relativePath = path.relative(from, to)
  const { base, name } = path.parse(relativePath)
  return path.join(relativePath.replace(base, '') + name + '/index')
}
