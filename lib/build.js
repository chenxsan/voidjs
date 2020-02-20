const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssoWebpackPlugin = require('csso-webpack-plugin').default

const {
  extensions,
  alias,
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
    logger.info(`${pages.length} pages collected`)

    logger.info('Building now, please wait...')
    const webpackConfigs = pages.map(page => {
      const { dir, name } = path.parse(path.relative(root, page))
      return {
        mode: 'production',
        optimization: {
          minimize: true,
          minimizer: [
            new TerserJSPlugin({
              terserOptions: {},
              extractComments: false
            })
          ],
          splitChunks: {
            chunks: 'all',
            name: false
          }
        },
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
        module: {
          rules: [
            {
              test: /\.(js|jsx|ts|tsx|mjs)$/i,
              exclude: /node_modules/,
              use: [
                {
                  loader: 'babel-loader',
                  options: {
                    presets: ['@babel/preset-env', '@babel/preset-react'],
                    plugins: ['react-require'],
                    cacheDirectory: true,
                    cacheCompression: false
                  }
                }
              ]
            },
            {
              test: /\.(png|svg|jpg|gif)$/i,
              use: [
                'file-loader',
                {
                  loader: 'image-webpack-loader'
                }
              ]
            },
            {
              test: /\.css$/i,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader
                },
                'css-loader',
                {
                  loader: 'postcss-loader',
                  options: {
                    ident: 'postcss',
                    plugins: [require('tailwindcss'), require('autoprefixer')]
                  }
                }
              ]
            }
          ]
        },
        resolve: {
          extensions,
          alias
        },
        plugins: [
          new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].[contenthash].css'
          }),
          new CssoWebpackPlugin({
            restructure: false
          }),
          new HtmlWebpackPlugin({
            // should put before SsrPlugin
            title: 'htmlgaga',
            meta: {
              'utf-8': {
                charset: 'utf-8'
              },
              viewport:
                'width=device-width, initial-scale=1.0, viewport-fit=cover'
            },
            minify: false,
            inject: false,
            cache: false,
            showErrors: false
          }),
          new SsrPlugin()
        ]
      }
    })
    const compiler = webpack(webpackConfigs)

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
