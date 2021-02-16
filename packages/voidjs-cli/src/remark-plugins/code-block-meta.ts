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
import visit from 'unist-util-visit'
import type { Node, Parent } from 'unist'
interface ExtendNode extends Node {
  lang?: string | null
  meta: string | null
}
export default function remarkCodeBlockMeta(options) {
  return function transformer(tree): void {
    visit(
      tree,
      'code',
      function visitor(node: ExtendNode, index, parent: Parent): void {
        const { lang, meta } = node
        if (lang !== null) {
          node.data = {
            hProperties: {
              dataLanguage: lang,
            },
          }
        }
        if (meta !== null) {
          const params = new URLSearchParams(
            meta
              .split(' ')
              .filter((s) => s !== '')
              .map((s) => s.trim())
              .join('&')
          )
          if (params.has('filename')) {
            // wrap node in a div
            parent.children.splice(index, 1, {
              type: 'paragraph',
              data: {
                hName: 'div',
                hProperties: {
                  className: 'remark-code-block-meta',
                },
              },
              children: [
                {
                  type: 'paragraph',
                  data: {
                    hName: 'div',
                    hProperties: {
                      className: 'remark-code-block-meta__filename',
                    },
                  },
                  children: [
                    {
                      type: 'text',
                      value: params.get('filename'),
                    },
                  ],
                },
                parent.children[index],
              ],
            })
          }
          // nullify meta
          node.meta = null
        }
      }
    )
  }
}
