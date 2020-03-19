import webpack from 'webpack'
import * as path from 'path'
import * as fs from 'fs'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import TerserJSPlugin from 'terser-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssoWebpackPlugin from 'csso-webpack-plugin'
import WebpackAssetsManifest from 'webpack-assets-manifest'
import getHtmlFilenameFromRelativePath from '../DevServer/getFilenameFromRelativePath'
import merge from 'deepmerge'

import Inspector from './Inspector'

interface WebpackError extends Error {
  details?: any
}

import {
  extensions,
  alias,
  logger,
  cwd,
  performance,
  PerformanceObserver
} from '../config'

import collectPages from '../collectPages'

import SsrPlugin from './ServerSideRenderingPlugin'

import validateSchema from 'schema-utils'
import schema from '../schemas/htmlgaga.config.json'
import { JSONSchema7 } from 'schema-utils/declarations/validate'

interface HtmlgagaConfig {
  html: {
    lang: string
    pretty: boolean
    preload: {
      script: boolean
      style: boolean
    }
  }
}

const configName = path.resolve(cwd, 'htmlgaga.config.js')

const BEGIN = 'begin'
const END = 'end'

class Builder {
  pages: string[]
  pagesDir: string
  outputPath: string
  config: HtmlgagaConfig
  spinner

  constructor(pagesDir: string, outputPath: string) {
    this.pagesDir = pagesDir
    this.outputPath = outputPath

    this.config = {
      html: {
        lang: 'en',
        pretty: true,
        preload: {
          style: true,
          script: true
        }
      }
    }
    if (fs.existsSync(configName)) {
      this.resolveConfig().catch(err => {
        logger.error(err)
        process.exit(1)
      })
    }
  }

  async resolveConfig(): Promise<void> {
    const config = await import(configName)
    validateSchema(schema as JSONSchema7, config.default, {
      name: 'htmlgaga.config.js'
    })
    this.config = merge(this.config, config)
  }

  // /path/to/pages/index.js -> index
  normalizedPageEntry(pageEntry: string): string {
    return path
      .relative(this.pagesDir, pageEntry)
      .split(path.sep)
      .join('-')
      .replace(new RegExp(`\\${path.extname(pageEntry)}$`), '')
  }

  createWebpackConfig(pages: string[]): webpack.Configuration {
    // {[outputHtml]: input}
    // ssrPlugin needs it
    const outputMapInput = pages.reduce((acc, pageEntry) => {
      const outputHtml = getHtmlFilenameFromRelativePath(
        this.pagesDir,
        pageEntry
      )
      acc[outputHtml] = this.normalizedPageEntry(pageEntry)
      return acc
    }, {})

    const entries = pages.reduce((acc, page) => {
      // acc['index'] = '/path/to/page.js'
      acc[this.normalizedPageEntry(page)] = page
      return acc
    }, {})

    const htmlPlugins = pages.map(page => {
      const filename = getHtmlFilenameFromRelativePath(this.pagesDir, page)
      return new HtmlWebpackPlugin({
        chunks: [this.normalizedPageEntry(page)],
        filename,
        minify: false,
        inject: false,
        cache: false,
        showErrors: false,
        meta: false
      })
    })

    return {
      mode: 'production',
      entry: {
        ...entries
      },
      output: {
        path: path.resolve(this.outputPath),
        libraryTarget: 'commonjs2',
        filename: (chunkData: webpack.ChunkData): string => {
          if (entries[chunkData.chunk.name]) {
            // do not include contenthash for those entry pages
            // since we only use it for server side render
            return '[name]'
          }
          return '[name].[contenthash].js'
        },
        chunkFilename: '[name]-[id].[contenthash].js'
      },
      module: {
        rules: [
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
                  cacheCompression: false
                }
              }
            ]
          },
          {
            test: /\.(png|svg|jpg|gif)$/i,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[name].[contenthash].[ext]'
                }
              },
              {
                loader: 'image-webpack-loader'
              }
            ]
          },
          {
            test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[name].[ext]',
                  outputPath: 'fonts/'
                }
              }
            ]
          },
          {
            test: /\.(sa|sc|c)ss$/i,
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
              },
              'sass-loader'
            ]
          }
        ]
      },
      resolve: {
        extensions,
        alias
      },
      plugins: [
        new WebpackAssetsManifest({
          output: 'assets.json'
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"production"'
        }),
        new CssoWebpackPlugin({
          restructure: false
        }),
        ...htmlPlugins,
        new SsrPlugin({
          outputMapInput: outputMapInput,
          html: this.config.html
        }),
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].css'
        }),
        new Inspector({ name: 'server' })
      ]
    }
  }

  private clientJsCompiler(entry: {
    [propName: string]: string
  }): webpack.Compiler {
    const config: webpack.Configuration = {
      mode: 'production',
      optimization: {
        minimize: true,
        minimizer: [
          new TerserJSPlugin({
            terserOptions: {},
            extractComments: false
          })
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
              priority: -10
            }
          }
        }
      },
      entry,
      output: {
        path: path.resolve(this.outputPath),
        filename: '[name].[contenthash].js',
        chunkFilename: '[name]-[id].[contenthash].js'
      },
      module: {
        rules: [
          {
            test: /\.(js|mjs)$/i,
            exclude: /node_modules/,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env'],
                  cacheDirectory: true,
                  cacheCompression: false
                }
              }
            ]
          }
        ]
      },
      plugins: [
        new HtmlWebpackPlugin({
          minify: false,
          inject: false,
          cache: false,
          showErrors: false,
          meta: false
        }),
        new WebpackAssetsManifest({
          output: 'client-assets.json'
        }),
        new Inspector({ name: 'client' })
      ]
    }
    return webpack(config)
  }
  private runCallback(err: WebpackError, stats: webpack.Stats): void {
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
      info.errors.forEach(err => logger.error(err))
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
        `All ${this.pageOrPages(this.pages.length)} built in ${(
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

  async run(): Promise<void> {
    this.markBegin()
    logger.info('Collecting pages...')
    this.pages = await collectPages(this.pagesDir)

    logger.info(`${this.pageOrPages(this.pages.length)} collected`)

    const compiler = webpack(this.createWebpackConfig(this.pages))

    const clientJs = path.resolve(cwd, 'public/js/index.js')

    if (fs.existsSync(clientJs)) {
      const clientJsCompiler = this.clientJsCompiler({
        client: clientJs
      })
      logger.info('Building client js...')

      // run compilers sequentially
      clientJsCompiler.run((err: Error, stats: webpack.Stats) => {
        this.runCallback(err, stats)
        logger.info('Building pages...')
        compiler.run((err, stats) => {
          this.runCallback(err, stats)
          this.markEnd()
        })
      })
    } else {
      compiler.run(this.runCallback.bind(this))
    }
  }
}

export default Builder
