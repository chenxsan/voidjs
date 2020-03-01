export default function findFirstPage(pages: string[]): string {
  const indexPages = pages
    .filter(page => page.endsWith('index.js'))
    .sort((a, b) => a.length - b.length);
  const nonIndexPages = pages
    .filter(page => !page.endsWith('index.js'))
    .sort((a, b) => a.length - b.length);

  const firstPage = indexPages.length > 0 ? indexPages[0] : nonIndexPages[0];
  return firstPage;
}
