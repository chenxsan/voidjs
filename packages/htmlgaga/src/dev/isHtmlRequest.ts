export default function isHtmlRequest(url: string): boolean {
  if (url.endsWith('/')) return true;
  if (/\.html$/.test(url)) return true;
  return false;
}
