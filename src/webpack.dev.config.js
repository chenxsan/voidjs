const path = require('path')

const { devConfig } = require('./config')

const cwd = process.cwd()

module.exports = {
  entry: {
    index: path.resolve(__dirname, 'app'),
    client: path.resolve(cwd, './static/js/index')
  },
  ...devConfig
}
