import * as fs from 'fs'
import * as path from 'path'
import { cwd } from './config'

interface FilterFunc {
  (path: string): boolean
}

const doNotFilter = (): boolean => true

// returns an array of all pages' absolute path
async function collect(
  root: string = cwd,
  filter: FilterFunc = doNotFilter,
  acc: string[] = []
): Promise<string[]> {
  const files = await fs.promises.readdir(root)
  for (const file of files) {
    const filePath = path.resolve(root, file)
    const stats = await fs.promises.stat(filePath)
    if (stats.isFile()) {
      const f = filePath
      if (filter(f)) {
        acc.push(f)
      }
    } else if (stats.isDirectory()) {
      await collect(filePath, filter, acc)
    }
  }
  return acc
}
export default collect
