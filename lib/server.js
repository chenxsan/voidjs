const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const webpackConfig = require('./webpack.config')
const compiler = webpack(webpackConfig)
const devServerOptions = Object.assign({}, webpackConfig.devServer, {})

module.exports = () => new WebpackDevServer(compiler, devServerOptions)
