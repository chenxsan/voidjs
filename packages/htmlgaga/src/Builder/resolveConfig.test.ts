import Builder, { defaultConfiguration } from './index'
import { vol } from 'memfs'
jest.mock('fs')
describe('resolveConfig', () => {
  afterEach(() => {
    vol.reset()
  })
  it('should return default config if htmlgaga.config.js not present', async () => {
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
  xit('should return what user has in htmlgaga.config.js', async () => {
    const htmlgagaConfig = {
      html: {
        pretty: false,
      },
    }
    vol.fromJSON(
      {
        './pages/index.js': 'var a = 1;',
        './out/tmp': '',
        './htmlgaga.config.js': `module.exports=${JSON.stringify(
          htmlgagaConfig
        )}`,
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
