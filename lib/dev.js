const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const { cwd, extensions, alias } = require('./config')

const webpackConfig = {
  mode: 'development',
  entry: {
    index: path.resolve(__dirname, 'app'),
    client: path.resolve(cwd, './public/js/index')
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
              plugins: ['react-require']
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
    new HtmlWebpackPlugin({
      title: 'HTML gaga',
      template: path.resolve(__dirname, 'templates/dev.html')
    })
  ]
}

const compiler = webpack(webpackConfig)
const devServerOptions = Object.assign({}, webpackConfig.devServer, {
  stats: 'minimal'
})

module.exports = () => new WebpackDevServer(compiler, devServerOptions)
