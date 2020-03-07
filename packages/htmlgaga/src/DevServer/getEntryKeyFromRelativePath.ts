import * as path from 'path'
export default function getEntryKeyFromRelativePath(
  from: string,
  to: string
): string {
  const relativePath = path.relative(from, to)
  const { base, name } = path.parse(relativePath)
  return relativePath.replace(base, '') + name + '/index'
}
