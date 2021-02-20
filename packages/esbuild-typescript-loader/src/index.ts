import { transformSync } from 'esbuild'
import { getOptions } from 'loader-utils'
export default function esbuildTypeScriptLoader(content: string): string {
  const options = getOptions(this)
  const { code } = transformSync(content, options)
  return code
}
