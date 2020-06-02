import Builder from './index'
import { sep, join } from 'path'
import { vol } from 'memfs'
jest.mock('fs')
describe('Builder', () => {
  afterEach(() => {
    vol.reset()
  })
  it('normalizedPageEntry', () => {
    const pagesDir = join('/project/html/pages/')
    const indexJs = join(pagesDir, 'index.js')
    const testJs = join(pagesDir, 'test/index.js')
    vol.fromJSON({
      [indexJs]: '',
      [testJs]: '',
    })
    const builder = new Builder(pagesDir, join('/project/html/output'))
    expect(builder.normalizedPageEntry(indexJs)).toBe('index')
    expect(builder.normalizedPageEntry(testJs)).toBe(
      ['test', 'index'].join(sep)
    )
  })
  it('should build', async () => {
    vol.fromJSON(
      {
        './pages/index.js': 'var a = 5;',
        './out/tmp.txt': 'hello',
      },
      '/app'
    )
    const builder = new Builder('/app/pages', '/app/out')
    await builder.run()
  })
})
