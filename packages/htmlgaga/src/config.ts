import { resolve, join } from 'path'
import pino from 'pino'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

// FIXME weird bug on windows
// it would resolve to htmlgaga\node_modules\@htmlgaga\doc
// when I run `yarn dev` under htmlgaga\packages\doc
export const cwd = process.cwd()

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  prettyPrint: {
    translateTime: 'HH:MM:ss',
    ignore: 'pid,hostname',
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
})

export const alias = {
  img: resolve(cwd, 'public/img'),
  css: resolve(cwd, 'public/css'),
  js: resolve(cwd, 'public/js'),
}
export const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json']

export const performance: Performance = require('perf_hooks').performance
export const PerformanceObserver = require('perf_hooks').PerformanceObserver

export const cacheRoot = join(cwd, '.htmlgaga', 'cache')

// rules for webpack production mode
export const rules = [
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
          cacheCompression: false,
        },
      },
    ],
  },
  {
    test: /\.(md|mdx)$/i,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: ['react-require'],
          cacheDirectory: true,
          cacheCompression: false,
        },
      },
      {
        loader: '@mdx-js/loader',
      },
    ],
  },
  {
    test: /\.(png|svg|jpg|gif)$/i,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[name].[contenthash].[ext]',
        },
      },
      {
        loader: 'image-webpack-loader',
      },
    ],
  },
  {
    test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'fonts/',
        },
      },
    ],
  },
  {
    test: /\.(sa|sc|c)ss$/i,
    use: [
      {
        loader: MiniCssExtractPlugin.loader,
      },
      'css-loader',
      {
        loader: 'postcss-loader',
        options: {
          ident: 'postcss',
          plugins: [require('tailwindcss'), require('autoprefixer')],
        },
      },
      'sass-loader',
    ],
  },
]
