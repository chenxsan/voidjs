import deriveEntryKeyFromRelativePath from './deriveEntryKeyFromRelativePath'
import hasClientEntry from './hasClientEntry'
import type { EntryObject } from 'webpack'

const socketClient = `${require.resolve('../Client')}`
export default function createEntries(
  pagesDir: string,
  pages: string[]
): EntryObject {
  const entrypoints = pages.reduce((acc, page) => {
    const entryKey = deriveEntryKeyFromRelativePath(pagesDir, page)
    const hasClientJs = hasClientEntry(page)
    // page entry depends on vendors
    const entry: EntryObject = {
      [entryKey]: [socketClient, page],
    }
    if (hasClientJs.exists === true) {
      // client entry depends on page entry
      entry[
        deriveEntryKeyFromRelativePath(
          pagesDir,
          hasClientJs.clientEntry as string
        )
      ] = {
        import: [hasClientJs.clientEntry as string],
        dependOn: [entryKey],
      }
    }
    acc = {
      ...acc,
      ...entry,
    }
    return acc
  }, {})
  return {
    ...entrypoints,
  }
}
