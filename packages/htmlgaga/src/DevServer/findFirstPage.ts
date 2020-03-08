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
