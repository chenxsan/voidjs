import deriveEntryKeyFromRelativePath from './deriveEntryKeyFromRelativePath'
import hasClientEntry from './hasClientEntry'
import type { EntryObject } from './index'
import vendorsList from './vendors'

const socketClient = `${require.resolve('../Client')}`
export default function createEntries(
  pagesDir: string,
  pages: string[],
  vendors = vendorsList
): EntryObject {
  const entrypoints = pages.reduce((acc, page) => {
    const entryKey = deriveEntryKeyFromRelativePath(pagesDir, page)
    const hasClientJs = hasClientEntry(page)
    // page entry depends on vendors
    const entry: EntryObject = {
      [entryKey]: {
        import: [socketClient, page],
        dependOn: Object.keys(vendors),
      },
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
    ...vendors,
  }
}
