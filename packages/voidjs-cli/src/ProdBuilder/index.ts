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
import * as path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssoWebpackPlugin from 'csso-webpack-plugin'
import WebpackAssetsManifest from 'webpack-manifest-plugin'
import deriveHtmlFilenameFromRelativePath from '../DevServer/deriveFilenameFromRelativePath'

import ClientJsCompiler from './ClientJsCompiler'
import ServerSideRender from './ServerSideRender/index'
import normalizeAssetPath from './normalizeAssetPath'
import Builder, { VoidjsConfig } from '../Builder'

import type { Stats } from 'webpack'

import {
  rules,
  extensions,
  alias,
  logger,
  performance,
  PerformanceObserver,
  cacheRoot,
  publicFolder,
} from '../config'

import collectPages from '../collectFiles'

import PersistDataPlugin from '../webpackPlugins/PersistDataPlugin'
import RemoveAssetsPlugin from '../webpackPlugins/RemoveAssetsPlugin'
import fs from 'fs-extra'

export function generateManifest(
  seed,
  files,
  entrypoints
): {
  files: {
    [key: string]: string
  }
  entrypoints: {
    [key: string]: string[]
  }
} {
  return {
    files: files.reduce(
      (manifest, { name, path }) => ({ ...manifest, [name]: path }),
      seed
    ),
    entrypoints,
  }
}

const BEGIN = 'begin'
const END = 'end'

interface WebpackError {
  name: string
  message: string
  stack?: string
  details?: string
}

export const ASSET_PATH = normalizeAssetPath()

class ProdBuilder extends Builder {
  #pages: string[]
  #outputPath: string
  config: VoidjsConfig
  #pageEntries: string[]

  constructor(pagesDir: string, outputPath: string) {
    super(pagesDir)
    this.#outputPath = outputPath

    this.#pageEntries = []
  }

  public normalizedPageEntry(pagePath: string): string {
    return path
      .relative(this.pagesDir, pagePath) // calculate relative path
      .replace(new RegExp(`\\${path.extname(pagePath)}$`), '') // remove extname
  }

  createWebpackConfig(pages: string[]): webpack.Configuration {
    const entries = pages.reduce((acc, page) => {
      const pageEntryKey = this.normalizedPageEntry(page)
      this.#pageEntries.push(pageEntryKey)
      acc[pageEntryKey] = page
      return acc
    }, {})

    const htmlPlugins = pages.map((page) => {
      const filename = deriveHtmlFilenameFromRelativePath(this.pagesDir, page)
      return new HtmlWebpackPlugin({
        chunks: [this.normalizedPageEntry(page)],
        filename,
        minify: false,
        inject: false,
        cache: false,
        showErrors: false,
        meta: false,
      })
    })

    return {
      externals: ['react-helmet', 'react', 'react-dom'],
      mode: 'production',
      entry: {
        ...entries,
      },
      optimization: {
        minimize: false,
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
        libraryTarget: 'commonjs2',
        filename: (pathData): string => {
          if (pathData?.chunk?.name) {
            if (entries[pathData?.chunk?.name]) {
              // do not include contenthash for those entry pages
              // since we only use it for server side render
              return '[name].js'
            }
          }

          return '[name].[contenthash].js'
        },
        chunkFilename: '[name]-[id].[contenthash].js',
        publicPath: ASSET_PATH ?? this.config.assetPath, // ASSET_PATH takes precedence over assetPath in voidjs.config.js
      },
      module: {
        rules,
      },
      resolve: {
        extensions,
        alias,
      },
      plugins: [
        new PersistDataPlugin(),
        new WebpackAssetsManifest({
          fileName: 'assets.json',
          generate: generateManifest,
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"',
        }),
        new CssoWebpackPlugin({
          restructure: false,
        }),
        ...htmlPlugins,
        new RemoveAssetsPlugin(
          (filename) =>
            this.#pageEntries.indexOf(filename.replace('.html', '')) !== -1,
          (filename) =>
            logger.debug(`${filename} removed by RemoveAssetsPlugin`)
        ),
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].css',
        }),
      ],
    }
  }

  private runCallback(err?: WebpackError, stats?: Stats): void {
    if (err) {
      if (err.stack) {
        logger.error(err.stack)
      } else {
        logger.error(err)
      }
      if (err.details) {
        logger.error(err.details)
      }
      return
    }
    if (!stats) return

    const info = stats.toJson()
    if (stats.hasErrors()) {
      info.errors.forEach((err: { message: string }) =>
        logger.error(err.message)
      )
    }
    if (stats.hasWarnings()) {
      info.warnings.forEach((warning: { message: string }) =>
        logger.warn(warning.message)
      )
    }
  }
  // measure end
  private markEnd(): void {
    performance.mark(END)
    performance.measure(`${BEGIN} to ${END}`, BEGIN, END)
    const observerCallback: PerformanceObserverCallback = (list, observer) => {
      logger.info(
        `All ${this.pageOrPages(this.#pages.length)} built in ${(
          list.getEntries()[0].duration / 1000
        ).toFixed(2)}s!`
      )

      observer.disconnect()
    }
    const obs = new PerformanceObserver(observerCallback)
    obs.observe({ entryTypes: ['measure'] })
    performance.measure('Build time', BEGIN, END)
  }
  // measure begin
  private markBegin(): void {
    performance.mark(BEGIN)
  }

  private pageOrPages(len: number): string {
    return len < 2 ? len + ' page' : len + ' pages'
  }

  async ssr(): Promise<void> {
    for (const templateName of this.#pageEntries) {
      const ssr = new ServerSideRender()
      if (Array.isArray(this.config.plugins)) {
        for (const plugin of this.config.plugins) {
          plugin.apply(ssr)
        }
      }
      ssr.run(
        this.pagesDir,
        templateName,
        cacheRoot,
        this.#outputPath,
        this.config
      )
    }
  }

  async run(): Promise<void> {
    this.markBegin()
    logger.info('Collecting pages...')
    this.#pages = await collectPages(this.pagesDir, searchPageEntry)

    logger.info(`${this.pageOrPages(this.#pages.length)} collected`)

    // resolve voidjs config
    await this.resolveConfig()

    const compiler = webpack(this.createWebpackConfig(this.#pages))

    compiler.run(async (err, stats) => {
      this.runCallback(err, stats)
      await this.ssr()
      const clientJsCompiler = new ClientJsCompiler(
        this.pagesDir,
        this.#outputPath,
        this.config
      )
      await clientJsCompiler.run((err, stats) => {
        this.runCallback(err, stats)
        this.cleanCache()
        // copy public
        if (fs.existsSync(path.join(this.pagesDir, '..', publicFolder))) {
          fs.copySync(
            path.join(this.pagesDir, '..', publicFolder),
            this.#outputPath
          )
        }
        this.markEnd()
      })
    })
  }

  cleanCache(): void {
    fs.removeSync(cacheRoot)
  }
}

export default ProdBuilder

export const exts = 'mjs,js,jsx,ts,tsx,md,mdx'

export function searchPageEntry(pagePath: string, extList = exts): boolean {
  const entryPattern = new RegExp(`.(${extList.split(',').join('|')})$`)
  return (
    entryPattern.test(pagePath) &&
    extList
      .split(',')
      .every((ext) => pagePath.includes(`.client.${ext}`) === false)
  )
}
