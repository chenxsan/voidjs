import deriveEntryKeyFromRelativePath from './deriveEntryKeyFromRelativePath'
import hasClientEntry from './hasClientEntry'
import type { EntryObject } from './index'

const socketClient = `${require.resolve('../Client')}`
export default function createEntries(
  pagesDir: string,
  pages: string[]
): EntryObject {
  const entrypoints = pages.reduce((acc, page) => {
    const entryKey = deriveEntryKeyFromRelativePath(pagesDir, page)
    const hasClientJs = hasClientEntry(page)
    const entry: EntryObject = {
      [entryKey]: [socketClient, page],
    }
    if (hasClientJs.exists === true) {
      entry[
        deriveEntryKeyFromRelativePath(
          pagesDir,
          hasClientJs.clientEntry as string
        )
      ] = [hasClientJs.clientEntry as string]
    }
    acc = {
      ...acc,
      ...entry,
    }
    return acc
  }, {})
  return entrypoints
}
