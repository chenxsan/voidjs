import Builder, { defaultConfiguration, VoidjsConfig } from './index'
import { vol } from 'memfs'
import { describe, afterEach, beforeEach, it, expect } from '@jest/globals'
jest.mock('fs')
describe('applyOptionsDefaults', () => {
  afterEach(() => {
    vol.reset()
  })
  beforeEach(() => {
    vol.fromJSON(
      {
        './pages/index.js': 'var a = 1;',
        './out/tmp': '',
      },
      '/app'
    )
  })
  it('should return defaultConfiguration', async () => {
    const builder = new Builder('/app/pages')
    builder.config = {} as VoidjsConfig
    builder.applyOptionsDefaults()
    expect(builder.config).toEqual(defaultConfiguration)
  })
  it('should merge defaultConfiguration', async () => {
    const builder = new Builder('/app/pages')
    builder.config = {
      html: {
        pretty: false,
      },
    } as VoidjsConfig
    builder.applyOptionsDefaults()
    expect(builder.config).toEqual({
      ...defaultConfiguration,
      html: {
        ...defaultConfiguration.html,
        pretty: false,
      },
    })
  })
})
