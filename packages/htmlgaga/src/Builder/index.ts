import merge from 'lodash.merge'
import path from 'path'
import { logger } from '../config'
import ServerSideRender from '../ProdBuilder/ServerSideRender/index'

interface Plugin {
  apply(compiler: ServerSideRender): void
}
export interface HtmlgagaConfig {
  html: {
    pretty: boolean
    preload: {
      script: boolean
      style: boolean
    }
  }
  plugins?: Plugin[]
  assetPath?: string
  globalScripts?: [
    string,
    {
      src: string
      global: string
    }
  ][]
}

// default htmlgaga.config.js
export const defaultConfiguration = {
  html: {
    pretty: true,
    preload: {
      style: true,
      script: true,
    },
  },
  plugins: [],
  assetPath: '',
}
const configuration = 'htmlgaga.config.js'

export default class Builder {
  pagesDir: string
  config: HtmlgagaConfig
  constructor(pagesDir: string) {
    this.pagesDir = pagesDir
  }
  applyOptionsDefaults(): void {
    this.config = {
      ...defaultConfiguration,
      ...this.config,
      html: merge({}, defaultConfiguration.html, this.config.html ?? {}),
      plugins: merge(
        [],
        defaultConfiguration.plugins,
        this.config.plugins ?? []
      ),
    }
  }
  async resolveConfig(): Promise<void> {
    const configName = path.resolve(this.pagesDir, '..', configuration)
    let config
    try {
      // how can I mock this in test?
      config = await import(configName)
    } catch (err) {
      // config file does not exist
      config = {}
    }

    this.config = config
    this.applyOptionsDefaults()
    logger.debug(configuration, this.config)
  }
}
