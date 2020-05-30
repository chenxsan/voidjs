import HtmlWebpackPlugin from 'html-webpack-plugin'
import hasClientEntry from './hasClientEntry'
import deriveEntryKeyFromRelativePath from './deriveEntryKeyFromRelativePath'
import deriveFilenameFromRelativePath from './deriveFilenameFromRelativePath'

export default function newHtmlWebpackPlugin(
  pagesDir: string,
  page: string
): HtmlWebpackPlugin {
  const htmlFilename = deriveFilenameFromRelativePath(pagesDir, page)
  const entryKey = deriveEntryKeyFromRelativePath(pagesDir, page)
  const hasClientJs = hasClientEntry(page)
  return new HtmlWebpackPlugin({
    template: require.resolve('../devTemplate'),
    chunks:
      hasClientJs.exists === true
        ? [
            entryKey,
            deriveEntryKeyFromRelativePath(
              pagesDir,
              hasClientJs.clientEntry as string
            ),
          ]
        : [entryKey],
    chunksSortMode: 'manual', // order matters, client entry must come after page entry
    filename: htmlFilename,
  })
}
