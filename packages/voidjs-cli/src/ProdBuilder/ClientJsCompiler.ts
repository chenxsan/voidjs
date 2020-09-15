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
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssoWebpackPlugin from 'csso-webpack-plugin'
import WebpackAssetsManifest from 'webpack-manifest-plugin'
import { extensions, alias, rules, cwd } from '../config'
import prettier from 'prettier'

import collectPages from '../collectFiles'

import { generateManifest } from './index'
import { VoidjsConfig } from '../Builder'
import { ASSET_PATH } from './index'

class PrettyPlugin {
  #options: VoidjsConfig
  constructor(options: VoidjsConfig) {
    this.#options = options
  }
  apply(compiler: webpack.Compiler): void {
    // TODO compiler.hooks.compilation.tap
    compiler.hooks.emit.tap('PrettyPlugin', (compilation) => {
      if (!this.#options.html?.pretty) return
      // TODO compilation.hooks.processAssets
      Object.keys(compilation.assets).forEach((asset) => {
        if (asset.endsWith('.html')) {
          const html = compilation.assets[asset]
          const source = html.source()
          const prettyHtml = prettier.format(
            Buffer.isBuffer(source) ? source.toString() : source,
            {
              parser: 'html',
            }
          )
          compilation.assets[asset] = {
            source: (): string => prettyHtml,
            size: (): number => prettyHtml.length,
          } as {
            size(): number
            source(): string | Buffer
            buffer(): Buffer
            map
            sourceAndMap
            updateHash
          }
        }
      })
    })
  }
}

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
  createWebpackConfig(entry: string): webpack.Configuration {
    const relative = path.relative(this.#pagesDir, entry)
    const outputHtml = relative.replace(/\.client\.(js|ts)$/, '.html')
    return {
      mode: 'production',
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
            vendors: path.resolve(cwd, 'node_modules'),
          },
        },
      },
      entry: {
        [relative
          .replace(/\.client.*/, '')
          .split(path.sep)
          .join('-')]: entry,
      },
      output: {
        // @ts-ignore
        environment: {
          arrowFunction: false,
          bigIntLiteral: false,
          destructuring: false,
          dynamicImport: false,
          module: false,
        }, // I need ie 11 support :(
        path: path.resolve(this.#outputPath),
        filename: '[name].[contenthash].js',
        chunkFilename: '[name]-[id].[contenthash].js',
        publicPath: ASSET_PATH ?? this.#config.assetPath,
      },
      module: {
        rules,
      },
      resolve: {
        extensions,
        alias,
      },
      externals: this.#config.globalScripts
        ? this.#config.globalScripts.map((script) => ({
            [script[0]]: script[1].global,
          }))
        : [],
      plugins: [
        new HtmlWebpackPlugin({
          template: path.resolve(this.#outputPath, outputHtml),
          filename: outputHtml,
          minify: this.#config.html?.pretty ?? true,
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"',
        }),
        new CssoWebpackPlugin({
          restructure: false,
        }),
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].css',
        }),
        new WebpackAssetsManifest({
          fileName: 'client-assets.json',
          generate: generateManifest,
        }),
        new PrettyPlugin(this.#config),
      ],
    }
  }
  async run(callback: (err, stats) => void): Promise<void> {
    this.#clients = await collectPages(
      this.#pagesDir,
      (filename) =>
        filename.endsWith('.client.js') || filename.endsWith('.client.ts')
    )
    const configs = this.#clients.map((client) =>
      this.createWebpackConfig(client)
    )
    // return
    webpack(configs).run(callback)
  }
}
