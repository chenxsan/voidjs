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
import webpack from 'webpack'
import path from 'path'
import TerserJSPlugin from 'terser-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssoWebpackPlugin from 'csso-webpack-plugin'
import WebpackAssetsMap from '../webpack-plugins/webpack-assets-map/src/index'
import { resolveExtensions, alias, rules } from '../config'
import HtmlPlugin from '../webpack-plugins/HtmlPluginForProduction'

import collectPages from '../collectFiles'

import { VoidjsConfig } from '../Builder'
import { ASSET_PATH } from './index'

export default class ClientsCompiler {
  #pagesDir: string
  #outputPath: string
  #clients: string[]
  #config: VoidjsConfig
  constructor(pagesDir: string, outputPath: string, config: VoidjsConfig) {
    this.#pagesDir = pagesDir
    this.#outputPath = outputPath
    this.#config = config
  }
  createWebpackConfig(entries: string[]): webpack.Configuration {
    return {
      mode: 'production',
      target: ['web', 'es5'],
      // cache: {
      //   type: 'filesystem',
      //   buildDependencies: {
      //     config: [__filename],
      //   },
      // },
      optimization: {
        minimize: true,
        minimizer: [
          new TerserJSPlugin({
            terserOptions: {},
            extractComments: false,
          }),
        ],
        splitChunks: {
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: 100,
              name: 'vendor',
            },
          },
        },
      },
      entry: entries.reduce((acc, entry) => {
        const relative = path.relative(this.#pagesDir, entry)
        acc[relative.replace(/\.client.*/, '')] = entry
        return acc
      }, {}),
      output: {
        path: path.resolve(this.#outputPath),
        filename: '[name].[contenthash].js',
        chunkFilename: '[name]-[id].[contenthash].js',
        publicPath: ASSET_PATH ?? this.#config.assetPath,
      },
      module: {
        rules,
      },
      resolve: {
        extensions: resolveExtensions,
        alias,
      },
      externals: this.#config.globalScripts
        ? this.#config.globalScripts.map((script) => ({
            [script[0]]: script[1].global,
          }))
        : [],
      plugins: [
        new HtmlPlugin(this.#outputPath, this.#config.html?.pretty),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"',
        }),
        // @ts-ignore
        new CssoWebpackPlugin({
          restructure: false,
        }),
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].css',
        }),
        new WebpackAssetsMap('client-assets.json'),
      ],
    }
  }
  async run(callback: (err, stats) => void): Promise<void> {
    this.#clients = await collectPages(
      this.#pagesDir,
      (filename) =>
        filename.endsWith('.client.js') || filename.endsWith('.client.ts')
    )
    const config = this.createWebpackConfig(this.#clients)
    // return
    webpack(config).run(callback)
  }
}
