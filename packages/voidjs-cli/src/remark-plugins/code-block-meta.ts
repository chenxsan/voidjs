import visit from 'unist-util-visit'
export default function remarkCodeBlockMeta() {
  return function transformer(tree): void {
    visit(tree, 'code', function visitor(node): void {
      console.log(node.meta)
      // TODO parse node.meta
    })
  }
}
