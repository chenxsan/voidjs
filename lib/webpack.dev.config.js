const path = require('path')

const { devConfig, cwd } = require('./config')

module.exports = {
  entry: {
    index: path.resolve(__dirname, 'app'),
    client: path.resolve(cwd, './static/js/index')
  },
  ...devConfig
}
