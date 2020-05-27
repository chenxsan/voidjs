/**
 * Copyright 2020-present, Sam Chen.
 * 
 * Licensed under GPL-3.0-or-later
 * 
 * This file is part of htmlgaga.

    htmlgaga is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    htmlgaga is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with htmlgaga.  If not, see <https://www.gnu.org/licenses/>.
 */
import webpack from 'webpack'
import * as path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssoWebpackPlugin from 'csso-webpack-plugin'
import WebpackAssetsManifest from 'webpack-assets-manifest'
import getHtmlFilenameFromRelativePath from '../DevServer/getFilenameFromRelativePath'

import ClientJsCompiler from './ClientJsCompiler'
import ServerSideRender from './ServerSideRender/index'
import merge from 'lodash.merge'

import type { Stats } from 'webpack'

import {
  rules,
  extensions,
  alias,
  logger,
  performance,
  PerformanceObserver,
  cacheRoot,
} from '../config'

import collectPages from '../collectFiles'

import validateSchema from 'schema-utils'
import schema from '../schemas/htmlgaga.config.json'
import { JSONSchema7 } from 'schema-utils/declarations/validate'
import PersistDataPlugin from '../webpackPlugins/PersistDataPlugin'
import RemoveAssetsPlugin from '../webpackPlugins/RemoveAssetsPlugin'

interface Plugin {
  apply(compiler: ServerSideRender): void
}
export interface HtmlgagaConfig {
  html: {
    pretty: boolean
    preload: {
      script: boolean
      style: boolean
    }
  }
  plugins: Plugin[]
}

const BEGIN = 'begin'
const END = 'end'

interface WebpackError {
  name: string
  message: string
  stack?: string
  details?: string
}

export const defaultOptions = {
  html: {
    pretty: true,
    preload: {
      style: true,
      script: true,
    },
  },
  plugins: [],
}

class Builder {
  #pages: string[]
  #pagesDir: string
  #cwd: string
  #outputPath: string
  config: HtmlgagaConfig
  #pageEntries: string[]
  #configName: string

  constructor(pagesDir: string, outputPath: string) {
    this.#pagesDir = pagesDir
    this.#cwd = path.join(pagesDir, '..')
    this.#outputPath = outputPath

    this.#pageEntries = []

    this.#configName = path.resolve(this.#cwd, 'htmlgaga.config.js')
  }

  applyOptionsDefaults(): void {
    this.config = {
      html: merge({}, defaultOptions.html, this.config.html ?? {}),
      plugins: merge([], defaultOptions.plugins, this.config.plugins ?? []),
    }
  }

  async resolveConfig(): Promise<void> {
    const configName = this.#configName
    let config
    try {
      // how can I mock this in test?
      config = await import(configName)
      validateSchema(schema as JSONSchema7, config.default, {
        name: 'htmlgaga.config.js',
      })
    } catch (err) {
      // config file does not exist
      config = {}
    }

    this.config = config
    this.applyOptionsDefaults()
    logger.debug('htmlgaga.config.js', this.config)
  }

  public normalizedPageEntry(pagePath: string): string {
    return path
      .relative(this.#pagesDir, pagePath) // calculate relative path
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
      const filename = getHtmlFilenameFromRelativePath(this.#pagesDir, page)
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
      experiments: {
        asset: true,
      },
      externals: ['react-helmet', 'react', 'react-dom'],
      mode: 'production',
      entry: {
        ...entries,
      },
      optimization: {
        minimize: false,
      },
      output: {
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
        publicPath: '/', // TODO, should be configurable
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
          output: 'assets.json',
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
      ssr.run(templateName, cacheRoot, this.#outputPath, this.config)
    }
  }

  async run(): Promise<void> {
    this.markBegin()
    logger.info('Collecting pages...')
    this.#pages = await collectPages(this.#pagesDir, filterPageEntry)

    logger.info(`${this.pageOrPages(this.#pages.length)} collected`)

    const compiler = webpack(this.createWebpackConfig(this.#pages))

    // resolve htmlgaga config
    await this.resolveConfig()

    compiler.run(async (err, stats) => {
      this.runCallback(err, stats)
      await this.ssr()
      const clientJsCompiler = new ClientJsCompiler(
        this.#pagesDir,
        this.#outputPath,
        this.config
      )
      await clientJsCompiler.run((err, stats) => {
        this.runCallback(err, stats)
        this.markEnd()
      })
    })
  }
}

export default Builder

export const exts = 'mjs,js,jsx,ts,tsx,md,mdx'

export function filterPageEntry(pagePath: string, extList = exts): boolean {
  const entryPattern = new RegExp(`.(${extList.split(',').join('|')})$`)
  return (
    entryPattern.test(pagePath) &&
    extList
      .split(',')
      .every((ext) => pagePath.includes(`.client.${ext}`) === false)
  )
}
