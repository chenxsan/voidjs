import { Helmet } from 'react-helmet'
export default class HelmetPlugin {
  apply(compiler): void {
    compiler.hooks.helmet.tap('HelmetPlugin', () => {
      compiler.helmet = Helmet.renderStatic()
    })
  }
}
