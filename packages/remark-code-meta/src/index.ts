import visit from 'unist-util-visit'
import type { Node, Parent } from 'unist'
import splitter from './splitter'
interface N extends Node {
  lang: string | null
  meta: string | null
}
interface RemarkPlugin {
  (tree: Node): void
}
interface Options {
  // use details/summary
  useDetails?: boolean
  className?: string
}
export default function remarkCodeMeta(options: Options = {}): RemarkPlugin {
  const { useDetails = true, className = 'remark-code-meta' } = options
  function visitor(node: N, index: number, parent: Parent | undefined) {
    const { lang, meta } = node
    if (lang !== null) {
      node.data = {
        hProperties: {
          dataLanguage: lang,
        },
      }
    }
    if (meta !== null) {
      const params = splitter(meta)
        ?.filter((s) => s !== '')
        .map((s) => s.trim())
        .reduce((acc, item) => {
          const index = item.indexOf('=')
          acc[item.substring(0, index)] = item
            .substring(index + 1)
            .replace(/"(.+)"/, '$1')
            .replace(/'(.+)'/, '$1')
          return acc
        }, {})
      if (typeof parent === 'undefined') return
      if (typeof params === 'undefined') return
      if (params['filename']) {
        let open: { open?: boolean }
        if (useDetails) {
          open = { open: true }
        } else {
          open = {}
        }
        if (params['open'] && params['open'] === 'false') {
          open = {
            open: false,
          }
        }
        // wrap node in a div
        parent.children.splice(index, 1, {
          type: 'paragraph',
          data: {
            hName: useDetails ? 'details' : 'div',
            hProperties: {
              className: className,
              ...open,
            },
          },
          children: [
            {
              type: 'paragraph',
              data: {
                hName: useDetails ? 'summary' : 'div',
                hProperties: {
                  className: `${className}__filename`,
                },
              },
              children: [
                {
                  type: 'text',
                  value: params['filename'],
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
  return function transformer(tree: Node): void {
    visit<N>(tree, 'code', visitor)
  }
}
