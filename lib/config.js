const path = require('path')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const CssoWebpackPlugin = require('csso-webpack-plugin').default

exports.performance = require('perf_hooks').performance
exports.PerformanceObserver = require('perf_hooks').PerformanceObserver

const jsRule = {
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
}
const imgRule = {
  test: /\.(png|svg|jpg|gif)$/i,
  use: [
    'file-loader',
    {
      loader: 'image-webpack-loader'
    }
  ]
}

const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json']

const logger = require('pino')({
  prettyPrint: {
    translateTime: 'yyyy-mm-dd HH:MM:ss',
    ignore: 'pid,hostname'
  }
})

const cwd = process.cwd()
const alias = {
  img: path.resolve(cwd, 'static/img'),
  css: path.resolve(cwd, 'static/css')
}

exports.cwd = process.cwd()
exports.logger = logger

exports.devConfig = {
  mode: 'development',
  module: {
    rules: [
      jsRule,
      imgRule,
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
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    })
  ]
}

exports.prodConfig = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserJSPlugin({
        terserOptions: {},
        extractComments: false
      })
    ]
  },
  module: {
    rules: [
      jsRule,
      imgRule,
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
    })
  ]
}
