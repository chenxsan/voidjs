import merge from 'lodash.merge'
import { HtmlgagaConfig } from './index'
export default (options: HtmlgagaConfig): void => {
  const defaultOptions = {
    html: {
      lang: 'en',
      pretty: true,
      preload: {
        style: true,
        script: true,
      },
    },
    plugins: [],
  }
  options.html = merge({}, defaultOptions.html, options.html ?? {})
  options.plugins = merge([], defaultOptions.plugins, options.plugins ?? [])
}
