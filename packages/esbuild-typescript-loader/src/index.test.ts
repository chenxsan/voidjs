import path from 'path'
import webpack, { Stats } from 'webpack'
import { createFsFromVolume, Volume } from 'memfs'
function webpackCompiler(fixture: string, options = {}): Promise<Stats> {
  const compiler = webpack({
    context: __dirname,
    entry: `./${fixture}`,
    output: {
      path: path.resolve(__dirname),
      filename: 'bundle.js',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: path.resolve(__dirname, 'index.ts'),
              options,
            },
          ],
        },
        {
          test: /\.tsx$/,
          use: [
            {
              loader: path.resolve(__dirname, 'index.ts'),
              options,
            },
          ],
        },
      ],
    },
  })
  // eslint-disable-next-line
  // @ts-ignore
  compiler.outputFileSystem = createFsFromVolume(new Volume())
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) reject(err)
      if (stats?.hasErrors()) reject(stats.toJson().errors)
      if (typeof stats !== 'undefined') resolve(stats)
    })
  })
}
describe('esbuild TypeScript Loader', () => {
  it('should transform ts', async () => {
    const stats = await webpackCompiler('example.ts')
    const modules = stats.toJson({ source: true }).modules ?? []
    const output = modules[0].source
    expect(output).toContain('const a = 42;')
    expect(output).toMatchSnapshot()
  })
  it('should transform tsx', async () => {
    const stats = await webpackCompiler('example.tsx', {
      loader: 'tsx',
    })
    const modules = stats.toJson({ source: true }).modules ?? []
    const output = modules[0].source
    expect(output).toMatchSnapshot()
  })
})
