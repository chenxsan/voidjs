import webpack from 'webpack'
import path from 'path'
import TerserJSPlugin from 'terser-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssoWebpackPlugin from 'csso-webpack-plugin'
import WebpackAssetsManifest from 'webpack-assets-manifest'
import { extensions, alias, rules } from '../config'
import prettier from 'prettier'

import collectPages from '../collectFiles'

import type { HtmlgagaConfig } from './index'

const data = Object.create(null)

class PrettyPlugin {
  #options: HtmlgagaConfig
  constructor(options: HtmlgagaConfig) {
    this.#options = options
  }
  apply(compiler: webpack.Compiler): void {
    compiler.hooks.emit.tap('PrettyPlugin', (compilation) => {
      if (!this.#options.html?.pretty) return
      Object.keys(compilation.assets).forEach((asset) => {
        if (asset.endsWith('.html')) {
          const html = compilation.assets[asset]
          const prettyHtml = prettier.format(html.source(), {
            parser: 'html',
          })
          compilation.assets[asset] = {
            source: (): string => prettyHtml,
            size: (): number => prettyHtml.length,
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
  #config: HtmlgagaConfig
  constructor(pagesDir: string, outputPath: string, config: HtmlgagaConfig) {
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
            vendors: {
              test: (module): boolean => {
                return (
                  /[\\/]node_modules[\\/]/.test(module.resource) &&
                  module.type === 'javascript/auto'
                )
              },
              chunks: 'all',
              priority: -10,
            },
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
        path: path.resolve(this.#outputPath),
        filename: '[name].[contenthash].js',
        chunkFilename: '[name]-[id].[contenthash].js',
      },
      module: {
        rules,
      },
      resolve: {
        extensions,
        alias,
      },
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
          assets: data,
          output: 'client-assets.json',
        }),
        new webpack.NamedChunksPlugin((chunk) => {
          // https://github.com/webpack/webpack/issues/1315#issuecomment-386267369
          // TODO remove for webpack 5
          if (chunk.name) {
            return chunk.name
          }

          return [...chunk._modules]
            .map((m) =>
              path.relative(
                m.context,
                m.userRequest.substring(0, m.userRequest.lastIndexOf('.'))
              )
            )
            .join('_')
        }),
        new webpack.HashedModuleIdsPlugin(),
        new PrettyPlugin(this.#config),
      ],
    }
  }
  async run(
    callback: (err: Error & { details?: string }, stats: webpack.Stats) => void
  ): Promise<void> {
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
