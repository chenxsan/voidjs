import Builder, { defaultConfiguration } from './index'
import { vol } from 'memfs'
import { describe, afterEach, it, expect, xit } from '@jest/globals'
jest.mock('fs')
describe('resolveConfig', () => {
  afterEach(() => {
    vol.reset()
  })
  it('should return default config if voidjs.config.js not present', async () => {
    vol.fromJSON(
      {
        './pages/index.js': 'var a = 1;',
        './out/tmp': '',
      },
      '/app'
    )
    const builder = new Builder('/app/pages')
    await builder.resolveConfig()
    expect(builder.config).toEqual(defaultConfiguration)
  })
  // FIXME
  // currently broken
  xit('should return what user has in voidjs.config.js', async () => {
    const voidjsConfig = {
      html: {
        pretty: false,
      },
    }
    vol.fromJSON(
      {
        './pages/index.js': 'var a = 1;',
        './out/tmp': '',
        './voidjs.config.js': `module.exports=${JSON.stringify(voidjsConfig)}`,
      },
      '/app'
    )

    const builder = new Builder('/app/pages')
    await builder.resolveConfig()
    expect(builder.config).toEqual({
      html: {
        pretty: false,
        preload: {
          script: true,
          style: true,
        },
      },
      plugins: [],
    })
  })
})
