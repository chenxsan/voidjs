import visit from 'unist-util-visit'
import type { Node, Parent } from 'unist'
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
      const params = new URLSearchParams(
        meta
          .split(' ')
          .filter((s) => s !== '')
          .map((s) => s.trim())
          .join('&')
      )
      if (typeof parent === 'undefined') return
      if (params.has('filename')) {
        // wrap node in a div
        parent.children.splice(index, 1, {
          type: 'paragraph',
          data: {
            hName: useDetails ? 'details' : 'div',
            hProperties: {
              className: className,
              open: true,
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
  return function transformer(tree: Node): void {
    visit<N>(tree, 'code', visitor)
  }
}
