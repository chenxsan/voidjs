import path from 'path'

function getName(page: string): string {
  const { name } = path.parse(page)
  return name
}

function isIndex(page: string): boolean {
  return getName(page) === 'index'
}

export default function findFirstPage(pages: string[]): string {
  const indexPages = pages.filter(isIndex).sort((a, b) => a.length - b.length)
  const nonIndexPages = pages
    .filter(page => !isIndex(page))
    .sort((a, b) => a.length - b.length)

  return indexPages.length > 0 ? indexPages[0] : nonIndexPages[0]
}
