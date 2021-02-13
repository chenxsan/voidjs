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
import webpack, { Compilation, Compiler } from 'webpack'
import * as path from 'path'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssoWebpackPlugin from 'csso-webpack-plugin'
import WebpackAssetsMap from '../webpack-plugins/webpack-assets-map/src/index'

import ClientJsCompiler from './ClientJsCompiler'
import ServerSideRender from './ServerSideRender/index'
import normalizeAssetPath from './normalizeAssetPath'
import Builder, { VoidjsConfig } from '../Builder'
import PluginHelmet from '../webpack-plugins/helmet-plugin'

import type { Stats } from 'webpack'

// TODO to be removed after MultiStats get exported from webpack
export interface MultiStats {
  stats: Stats[]
  readonly hash: string
  hasErrors(): boolean
  hasWarnings(): boolean
  toJson(
    options?: any
  ): {
    children: any[]
    version: any
    hash: string
    errors: any[]
    warnings: any[]
    errorsCount: number
    warningsCount: number
  }
  toString(options?: any): string
}

import {
  getRules,
  resolveExtensions,
  alias,
  logger,
  performance,
  PerformanceObserver,
  publicFolder,
  assetsPath,
} from '../config'

import collectPages from '../collectFiles'

import fs from 'fs-extra'
import hasCustomApp from '../utils/hasCustomApp'

const BEGIN = 'begin'
const END = 'end'

interface WebpackError {
  name: string
  message: string
  stack?: string
  details?: string
}

export const ASSET_PATH = normalizeAssetPath()

class CleanSpaJs {
  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap(
      'CleanSpaJs',
      (compilation: Compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'CleanSpaJs',
            stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_COUNT,
          },
          () => {
            compilation.getAssets().forEach((asset) => {
              if (asset.name.endsWith('.spa.js')) {
                compilation.deleteAsset(asset.name)
              }
            })
          }
        )
      }
    )
  }
}

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

  // FIXME we're building all pages together
  // is it necessary?
  // is it slow?
  // what if we build them one by one?
  // anyway to benchmark?
  createWebpackConfig(pages: string[]): webpack.Configuration[] {
    const entries = pages.reduce((acc, page) => {
      const pageEntryKey = this.normalizedPageEntry(page)
      this.#pageEntries.push(pageEntryKey)
      acc[pageEntryKey] = page
      return acc
    }, {})

    const outputPath = path.resolve(this.#outputPath, assetsPath)

    // bundle assets like image, css
    const client: webpack.Configuration = {
      name: 'client',
      mode: 'development',
      // TODO it's causing problem when set naively
      // cache: {
      //   type: 'filesystem',
      //   buildDependencies: {
      //     config: [__filename], // Make all dependencies of this file as build dependencies
      //   },
      // },
      entry: {
        ...entries,
      },
      optimization: {
        minimize: false, // we don't need the bundled js at all
      },
      target: ['web'],
      output: {
        path: outputPath,
        filename: '[name].spa.js', // TODO we don't care those spa js, should be removed
        chunkFilename: '[name]-[id].spa.js', // template won't have dynamic imports
        publicPath: ASSET_PATH ?? this.config.assetPath, // ASSET_PATH takes precedence over assetPath in voidjs.config.js
      },
      module: {
        rules: getRules(this.pagesDir, hasCustomApp(this.pagesDir)),
      },
      resolve: {
        extensions: resolveExtensions,
        alias,
      },
      plugins: [
        new WebpackAssetsMap(), // defaults to assets.json
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"',
        }),
        // @ts-ignore
        new CssoWebpackPlugin({
          restructure: false,
        }),
        new MiniCssExtractPlugin({
          // only one css should be enough,
          // e.g. server.[contenthash].css
          filename: 'server.[contenthash].css',
        }),
        new webpack.ProgressPlugin({
          profile: true,
        }),
        new CleanSpaJs(),
      ],
    }

    // bundle entries for server side rendering only
    const server: webpack.Configuration = {
      name: 'server',
      externals: ['react-helmet', 'react', 'react-dom'],
      mode: 'production',
      // TODO it's causing problem when set naively
      // cache: {
      //   type: 'filesystem',
      //   buildDependencies: {
      //     config: [__filename], // Make all dependencies of this file as build dependencies
      //   },
      // },
      entry: {
        ...entries,
      },
      optimization: {
        minimize: false,
        splitChunks: false,
      },
      target: ['node'],
      output: {
        path: outputPath,
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
        rules: getRules(this.pagesDir, hasCustomApp(this.pagesDir)),
      },
      resolve: {
        extensions: resolveExtensions,
        alias,
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"',
        }),
        new webpack.ProgressPlugin({
          profile: true,
        }),
      ],
    }

    return [client, server]
  }

  private runCallback(err?: WebpackError, stats?: any): void {
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
    const publicPath = ASSET_PATH ?? this.config.assetPath
    const outputPath = this.#outputPath
    const {
      default: { entrypoints },
    } = await import(path.join(outputPath, assetsPath, 'assets.json'))
    for (const templateName of this.#pageEntries) {
      const ssr = new ServerSideRender(publicPath ?? '')
      // PluginHelmet enabled by default
      new PluginHelmet().apply(ssr)
      if (Array.isArray(this.config.plugins)) {
        for (const plugin of this.config.plugins) {
          plugin.apply(ssr)
        }
      }
      // serverCompiler outputs a .js and a .css
      // js for server side rendering
      const css: string[] = entrypoints[templateName].filter((asset: string) =>
        asset.endsWith('.css')
      )
      ssr.run(this.pagesDir, templateName, this.#outputPath, this.config, css)
    }
  }

  async run(): Promise<void> {
    this.markBegin()

    // FIXME what if there're 1000 pages?
    // well, let's see
    logger.info('Collecting pages…')
    this.#pages = await collectPages(this.pagesDir, searchPageEntry)
    logger.info(`${this.pageOrPages(this.#pages.length)} collected`)

    // resolve voidjs.config.js as this.config
    await this.resolveConfig()

    /**
     * 1. we need to compile those page entries for server side rendering
     * 2. we need to compile client en]tries
     */

    const serverCompiler = webpack(this.createWebpackConfig(this.#pages))

    serverCompiler.run(async (err, stats) => {
      this.runCallback(err, stats)
      // FIXME here we're compiling files to disk and run ssr against them
      await this.ssr()

      // now compile client side js
      // - [ ] compile js
      // - [ ] inject assets into html generated by ssr
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
    if (hasCustomApp(this.pagesDir)) {
      fs.removeSync(path.join(this.#outputPath, '_app.js'))
    }
  }
}

export default ProdBuilder

// all those extensions are recognized as page entry
export const supportedPageExtensions = 'mjs,js,jsx,ts,tsx,md,mdx'

export function searchPageEntry(
  pagePath: string,
  extList = supportedPageExtensions
): boolean {
  const entryPattern = new RegExp(`.(${extList.split(',').join('|')})$`)
  // files with patterns of `.mjs|.js|.jsx|.ts|.tsx|.md|.mdx`

  return (
    entryPattern.test(pagePath) &&
    extList
      .split(',')
      // exclude all client entry
      .every((ext) => pagePath.includes(`.client.${ext}`) === false) &&
    path.basename(pagePath).startsWith('_') === false
  )
}
