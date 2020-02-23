const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const collectPages = require('../collectPages')
const getEntryKeyFromRelativePath = require('./getEntryKeyFromRelativePath')
const getFilenameFromRelativePath = require('./getFilenameFromRelativePath')
const { cwd, extensions, alias } = require('../config')

module.exports = async function(pagesDir) {
  const pages = await collectPages(pagesDir)

  const clientJs = path.resolve(cwd, 'public/js/index')

  function createWebpackConfig(pages) {
    // generate entries for pages
    const entries = pages.reduce((acc, page) => {
      acc[getEntryKeyFromRelativePath(pagesDir, page)] = [page, clientJs]
      return acc
    }, {})
    // generate htmlwebpackplugins for pages
    const htmlPlugins = pages.map(page => {
      const filename = getFilenameFromRelativePath(pagesDir, page)
      return new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../templates/dev.html'),
        chunks: [getEntryKeyFromRelativePath(pagesDir, page)],
        filename,
        title: `htmlgaga - ${filename}`
      })
    })
    return {
      mode: 'development',
      entry: entries,
      output: {
        publicPath: '/'
      },
      module: {
        rules: [
          {
            test: /\.(js|jsx|ts|tsx|mjs)$/i,
            exclude: [/node_modules/, path.resolve(cwd, 'pages')],
            use: [
              {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env', '@babel/preset-react'],
                  plugins: ['react-require']
                }
              }
            ]
          },
          {
            test: /\.(js|jsx|ts|tsx|mjs)$/i,
            include: path.resolve(cwd, 'pages'),
            use: [
              {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env', '@babel/preset-react'],
                  plugins: [
                    require('./babel-plugin-react-dom-render'),
                    'react-require'
                  ]
                }
              }
            ]
          },
          {
            test: /\.(png|svg|jpg|gif)$/i,
            use: ['file-loader']
          },
          {
            test: /\.css$/i,
            use: [
              'style-loader',
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
        ...htmlPlugins,
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"development"'
        })
      ]
    }
  }
  const webpackConfig = createWebpackConfig(pages)

  const compiler = webpack(webpackConfig)
  const devServerOptions = Object.assign({}, webpackConfig.devServer, {
    stats: 'minimal'
  })
  return new WebpackDevServer(compiler, devServerOptions)
}
