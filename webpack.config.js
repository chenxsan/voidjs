const HtmlWebpackPlugin = require('html-webpack-plugin')

const { rules, extensions, plugins, alias } = require('./config')

module.exports = {
  mode: 'development',
  entry: {
    index: './src/index',
    client: './static/js/index'
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
      template: './index.html'
    })
  ]
}
