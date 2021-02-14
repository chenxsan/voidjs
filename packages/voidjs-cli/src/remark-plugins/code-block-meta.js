import visit from 'unist-util-visit'
import type { Visitor } from 'unist-util-visit'
export default function remarkCodeBlockMeta() {
  return function transformer(tree) {
    visit(tree, 'code', function visitor(node): Visitor {
      console.log(node.meta)
      // TODO parse node.meta
    })
  }
}
