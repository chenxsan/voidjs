/**
 * Copyright 2020-present, Sam Chen.
 * 
 * Licensed under GPL-3.0-or-later
 * 
 * This file is part of voidjs.

    voidjs is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    voidjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with voidjs.  If not, see <https://www.gnu.org/licenses/>.
 */
import { resolve, join } from 'path'
import pino from 'pino'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import rehypePrism from '@mapbox/rehype-prism'
import fs from 'fs-extra'

// FIXME weird bug on windows
// it would resolve to voidjs\node_modules\@void-js\doc
// when I run `yarn dev` under voidjs\packages\doc
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

const assetsRoot = 'static'
export const alias = {
  img: resolve(cwd, `${assetsRoot}/img`),
  css: resolve(cwd, `${assetsRoot}/css`),
  js: resolve(cwd, `${assetsRoot}/js`),
}
export const publicFolder = 'public'

export const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json']

export const performance: Performance = require('perf_hooks').performance
export const PerformanceObserver = require('perf_hooks').PerformanceObserver

export const cacheRoot: string = join(cwd, '.voidjs', 'cache')

const tailwindcssEnabled: boolean = fs.existsSync(
  join(cwd, 'tailwind.config.js')
)

export const postcssPlugins = tailwindcssEnabled
  ? [require('tailwindcss'), require('autoprefixer')]
  : [require('autoprefixer')]

const babelPresets = [
  '@babel/preset-env',
  [
    '@babel/preset-react',
    {
      throwIfNamespace: false,
    },
  ],
  '@babel/preset-typescript',
]

// rules for webpack production mode
export const rules = [
  {
    test: /\.(js|jsx|ts|tsx|mjs)$/i,
    exclude: /node_modules/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: [...babelPresets],
          plugins: [
            'react-require',
            [
              '@babel/plugin-transform-runtime',
              {
                regenerator: true,
              },
            ],
          ],
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
          presets: [...babelPresets],
          plugins: ['react-require'],
          cacheDirectory: true,
          cacheCompression: false,
        },
      },
      {
        loader: '@mdx-js/loader',
        options: {
          rehypePlugins: [rehypePrism],
        },
      },
    ],
  },
  {
    test: /\.(png|svg|jpg|jpeg|gif)$/i,
    loader: 'file-loader',
    options: {
      name: '[name].[contenthash].[ext]',
    },
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
          postcssOptions: {
            ident: 'postcss',
            plugins: postcssPlugins,
          },
        },
      },
      'sass-loader',
    ],
  },
]
