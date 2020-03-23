import webpack from 'webpack'
import * as path from 'path'
import * as fs from 'fs-extra'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssoWebpackPlugin from 'csso-webpack-plugin'
import WebpackAssetsManifest from 'webpack-assets-manifest'
import PnpWebpackPlugin from 'pnp-webpack-plugin'
import getHtmlFilenameFromRelativePath from '../DevServer/getFilenameFromRelativePath'

import clientCompiler from './clientCompiler'
import Ssr from './Ssr'
import merge from 'lodash.merge'

import {
  rules,
  extensions,
  alias,
  logger,
  cwd,
  performance,
  PerformanceObserver,
  cacheRoot,
} from '../config'

import collectPages from '../collectPages'

import validateSchema from 'schema-utils'
import schema from '../schemas/htmlgaga.config.json'
import { JSONSchema7 } from 'schema-utils/declarations/validate'
import PersistDataPlugin from '../webpackPlugins/PersistDataPlugin'
import RemoveAssetsPlugin from '../webpackPlugins/RemoveAssetsPlugin'

interface Plugin {
  apply(compiler: Ssr): void
}
export interface HtmlgagaConfig {
  html?: {
    pretty: boolean
    preload: {
      script: boolean
      style: boolean
    }
  }
  plugins?: Plugin[]
}

const configName = path.resolve(cwd, 'htmlgaga.config.js')

const BEGIN = 'begin'
const END = 'end'

class Builder {
  #pages: string[]
  #pagesDir: string
  #outputPath: string
  #config: HtmlgagaConfig
  #outputPagesName: string[]
  #outputTemplatesName: string[]

  constructor(pagesDir: string, outputPath: string) {
    this.#pagesDir = pagesDir
    this.#outputPath = outputPath

    this.#outputPagesName = []
    this.#outputTemplatesName = []

    if (fs.existsSync(configName)) {
      this.resolveConfig().catch((err) => {
        logger.error(err)
        process.exit(1)
      })
    }
  }

  applyOptionsDefaults(): void {
    const defaultOptions = {
      html: {
        pretty: true,
        preload: {
          style: true,
          script: true,
        },
      },
      plugins: [],
    }
    this.#config = {
      html: merge({}, defaultOptions.html, this.#config.html ?? {}),
      plugins: merge([], defaultOptions.plugins, this.#config.plugins ?? []),
    }
  }

  async resolveConfig(): Promise<void> {
    const config = await import(configName)
    validateSchema(schema as JSONSchema7, config.default, {
      name: 'htmlgaga.config.js',
    })
    this.#config = config
    this.applyOptionsDefaults()
    logger.debug('htmlgaga.config.js', this.#config)
  }

  // /path/to/pages/index.js -> index
  normalizedPageEntry(pageEntry: string): string {
    return path
      .relative(this.#pagesDir, pageEntry)
      .split(path.sep)
      .join('-')
      .replace(new RegExp(`\\${path.extname(pageEntry)}$`), '')
  }

  createWebpackConfig(pages: string[]): webpack.Configuration {
    const entries = pages.reduce((acc, page) => {
      // acc['index'] = '/path/to/page.js'
      this.#outputTemplatesName.push(this.normalizedPageEntry(page))
      acc[this.normalizedPageEntry(page)] = page
      return acc
    }, {})

    const htmlPlugins = pages.map((page) => {
      const filename = getHtmlFilenameFromRelativePath(this.#pagesDir, page)
        .split(path.sep)
        .join('-')
      this.#outputPagesName.push(filename)
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
      externals: ['react-helmet'],
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
        filename: (chunkData: webpack.ChunkData): string => {
          if (entries[chunkData.chunk.name]) {
            // do not include contenthash for those entry pages
            // since we only use it for server side render
            return '[name].js'
          }
          return '[name].[contenthash].js'
        },
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
        PnpWebpackPlugin,
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
          (filename) => this.#outputPagesName.indexOf(filename) !== -1,
          (filename) =>
            logger.debug(`${filename} removed by RemoveAssetsPlugin`)
        ),
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].css',
        }),
      ],
    }
  }

  private runCallback(
    err: Error & { details?: string },
    stats: webpack.Stats
  ): void {
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

    const info = stats.toJson()
    if (stats.hasErrors()) {
      info.errors.forEach((err) => logger.error(err))
    }
    if (stats.hasWarnings()) {
      logger.warn('\n' + info.warnings.join('\n'))
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
    for (const templateName of this.#outputTemplatesName) {
      const ssr = new Ssr()
      if (Array.isArray(this.#config.plugins)) {
        for (const plugin of this.#config.plugins) {
          plugin.apply(ssr)
        }
      }
      ssr.run(templateName, cacheRoot, this.#outputPath, this.#config)
    }
  }

  async run(): Promise<void> {
    this.markBegin()
    logger.info('Collecting pages...')
    this.#pages = await collectPages(this.#pagesDir)

    logger.info(`${this.pageOrPages(this.#pages.length)} collected`)

    const compiler = webpack(this.createWebpackConfig(this.#pages))

    const clientJs = path.resolve(cwd, 'public/js/index.js')

    if (fs.existsSync(clientJs)) {
      const clientJsCompiler = clientCompiler(clientJs, this.#outputPath)
      logger.info('Building client js...')

      // run compilers sequentially
      clientJsCompiler.run((err: Error, stats: webpack.Stats) => {
        this.runCallback(err, stats)
        logger.info('Building pages...')
        compiler.run(async (err, stats) => {
          this.runCallback(err, stats)
          // after all compiled
          // we start server side rendering here
          await this.ssr()
          this.markEnd()
        })
      })
    } else {
      compiler.run(async (err, stats) => {
        this.runCallback(err, stats)
        await this.ssr()
        this.markEnd()
      })
    }
  }
}

export default Builder
