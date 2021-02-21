import { transformSync, TransformOptions } from 'esbuild'
import { getOptions } from 'loader-utils'
import { validate } from 'schema-utils'
import schema from './options.json'
import { JSONSchema7 } from 'json-schema'

export default function esbuildTypeScriptLoader(content: string): void {
  let options: TransformOptions = getOptions(this)
  options = { ...{ loader: 'ts', sourcemap: true }, ...options }

  validate(schema as JSONSchema7, options, {
    name: 'esbuild TypeScript Loader',
    baseDataPath: 'options',
  })
  const result = transformSync(content, options)
  const { code } = result
  if (options.sourcemap) {
    const { map } = result
    this.callback(null, code, JSON.parse(map))
  } else {
    this.callback(null, code)
  }
}
