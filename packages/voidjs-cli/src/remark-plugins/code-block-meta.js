import visit from 'unist-util-visit'
export default function remarkCodeBlockMeta() {
  return function transformer(tree) {
    visit(tree, 'code', function visitor(node) {
      console.log(node)
      // TODO parse node.meta
    })
  }
}
