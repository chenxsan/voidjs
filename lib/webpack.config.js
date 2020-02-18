const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const { rules, extensions, plugins, alias } = require('./config')

const cwd = process.cwd()

module.exports = {
  mode: 'development',
  entry: {
    index: path.resolve(__dirname, 'app'),
    client: path.resolve(cwd, './static/js/index')
  },
  module: {
    rules
  },
  resolve: {
    extensions,
    alias
  },
  plugins: [
    ...plugins,
    new HtmlWebpackPlugin({
      title: 'HTML gaga',
      template: path.resolve(__dirname, 'templates/dev.html')
    })
  ]
}
