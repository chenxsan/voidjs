const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const {
  prodConfig,
  logger,
  cwd,
  performance,
  PerformanceObserver
} = require('./config')
const collectPages = require('./collectPages')

const SsrPlugin = require('./ssrPlugin')

const dir = path.resolve(cwd, 'pages')
performance.mark('begin')
async function build(root = dir, outputPath) {
  try {
    logger.info('Collecting pages...')
    const pages = await collectPages(root)
    const webpackConfigs = pages.map(page => {
      const { dir, name } = path.parse(path.relative(root, page))
      return {
        ...prodConfig,
        entry: {
          main: page,
          client: path.resolve(cwd, 'static/js/index')
        },
        output: {
          path: path.resolve(outputPath, dir, name),
          libraryTarget: 'umd',
          globalObject: 'this',
          filename: '[name].[contenthash].js'
        },
        plugins: [
          ...prodConfig.plugins,
          new HtmlWebpackPlugin({
            // should put before SsrPlugin
            title: 'htmlgaga',
            meta: {
              'utf-8': {
                charset: 'utf-8'
              },
              viewport:
                'width=device-width, initial-scale=1.0, viewport-fit=cover'
            }
          }),
          new SsrPlugin()
        ]
      }
    })
    logger.info(`${pages.length} pages collected`)
    const compiler = webpack(webpackConfigs)

    logger.info('Compiling...')
    compiler.run((err, stats) => {
      if (err) {
        if (err.details) {
          logger.error(err.details)
        }
        return
      }
      if (stats.hasErrors()) {
        return stats.toJson().errors.forEach(err => logger.error(err))
      }
      performance.mark('end')
      performance.measure('begin to end', 'begin', 'end')
      const obs = new PerformanceObserver((list, observer) => {
        logger.info(
          `All ${pages.length} pages built in ${(
            list.getEntries()[0].duration / 1000
          ).toFixed(2)}s!`
        )

        observer.disconnect()
      })
      obs.observe({ entryTypes: ['measure'] })
      performance.measure('Build time', 'begin', 'end')
    })
  } catch (err) {
    logger.error(err)
  }
}
module.exports = build
