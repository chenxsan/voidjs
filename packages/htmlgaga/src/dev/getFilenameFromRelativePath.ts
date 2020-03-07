import * as path from 'path'
export default function(from: string, to: string): string {
  const relativePath = path.relative(from, to)
  const { ext } = path.parse(relativePath)
  return relativePath.replace(ext, '.html')
}
