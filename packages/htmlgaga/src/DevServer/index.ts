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
import * as fs from 'fs'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import collectPages from '../collectFiles'
import getEntryKeyFromRelativePath from './getEntryKeyFromRelativePath'
import getFilenameFromRelativePath from './getFilenameFromRelativePath'
import { extensions, alias, logger } from '../config'
import express from 'express'
import devMiddleware from 'webpack-dev-middleware'
import WebSocket from 'ws'
import http from 'http'
import isHtmlRequest from './isHtmlRequest'
import { MessageType } from '../Client/MessageType'
import rehypePrism from '@mapbox/rehype-prism'
import { searchPageEntry } from '../ProdBuilder'

interface EntryObject {
  [index: string]: [string, ...string[]]
}

class Page {
  page: string
  url: string
  constructor(page: string, url: string) {
    this.page = page
    this.url = url
  }
}

// we would only need it when HMR enabled
// const hotRuntime = 'webpack/hot/dev-server'

const socketPath = '/__websocket'

export interface Server {
  locateSrc(url: string): { exists: boolean; src?: string }
  start(): Promise<express.Application | void>
}

class DevServer implements Server {
  readonly #cwd: string
  readonly #pagesDir: string
  readonly #host: string
  readonly #port: number
  #pages: string[]

  // save entries for webpack compiling
  #entrypoints: EntryObject

  #wsServer: WebSocket.Server

  #httpServer: http.Server

  #compiler: webpack.Compiler

  constructor(pagesDir: string, { host, port }) {
    this.#pagesDir = pagesDir
    this.#cwd = path.resolve(pagesDir, '..')

    this.#host = host
    this.#port = port

    this.#entrypoints = {} as EntryObject
  }

  private htmlPlugin(page: string): HtmlWebpackPlugin {
    const filename = getFilenameFromRelativePath(this.#pagesDir, page)
    const entryKey = getEntryKeyFromRelativePath(this.#pagesDir, page)
    const clientJs = this.searchClientJs(page)
    return new HtmlWebpackPlugin({
      template: require.resolve('../devTemplate'),
      chunks:
        clientJs.exists === true
          ? [entryKey, `${entryKey}-client`]
          : [entryKey],
      chunksSortMode: 'manual',
      filename,
      title: `htmlgaga - ${filename}`,
    })
  }

  private searchClientJs(
    pagePath: string
  ): {
    exists: boolean
    filePath?: string
  } {
    const { name, dir } = path.parse(pagePath)
    const clientJs = path.resolve(dir, `${name}.client.js`)
    if (fs.existsSync(clientJs)) {
      return {
        exists: true,
        filePath: clientJs,
      }
    }
    return {
      exists: false,
    }
  }

  private webpackEntry(): () => EntryObject {
    return (): EntryObject => this.#entrypoints
  }

  private initWebpackConfig(): webpack.Configuration {
    return {
      experiments: {
        asset: true,
      },
      mode: 'development',
      entry: this.webpackEntry(),
      output: {
        publicPath: '/',
      },
      stats: 'minimal',
      module: {
        rules: [
          {
            test: /\.(js|jsx|ts|tsx)$/i,
            exclude: [/node_modules/],
            use: [
              {
                loader: 'babel-loader',
                options: {
                  presets: [
                    '@babel/preset-env',
                    '@babel/preset-react',
                    '@babel/preset-typescript',
                  ],
                  plugins: ['react-require'],
                  overrides: [
                    {
                      include: this.#pagesDir,
                      plugins: [
                        [
                          'react-dom-render',
                          {
                            hydrate: false,
                            root: 'htmlgaga-app',
                          },
                        ],
                      ],
                    },
                  ],
                },
              },
            ],
          },
          {
            test: /\.(mdx|md)$/,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  presets: [
                    '@babel/preset-env',
                    '@babel/preset-react',
                    '@babel/preset-typescript',
                  ],
                  plugins: ['react-require'],
                  overrides: [
                    {
                      include: this.#pagesDir,
                      plugins: [
                        [
                          'react-dom-render',
                          {
                            hydrate: false,
                            root: 'htmlgaga-app',
                          },
                        ],
                      ],
                    },
                  ],
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
            test: /\.(png|svg|jpg|gif)$/i,
            type: 'asset',
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
              'style-loader',
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
        ],
      },
      resolve: {
        extensions,
        alias,
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"development"',
          __WEBSOCKET__: JSON.stringify(
            `${this.#host}:${this.#port}${socketPath}`
          ),
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
      ],
    }
  }

  public locateSrc(
    url: string
  ): {
    src?: string
    exists: boolean
  } {
    if (url.endsWith('/')) url = url + '/index.html'
    const exts = ['tsx', 'jsx', 'js', 'mdx', 'md']
    for (let i = 0, len = exts.length; i < len; i++) {
      const target = path.join(
        this.#pagesDir,
        url.replace(/\.html$/, '') + `.${exts[i]}`
      )
      if (fs.existsSync(target)) {
        return {
          src: target,
          exists: true,
        }
      }
    }

    return {
      exists: false,
    }
  }

  cleanup(): void {
    this.#wsServer.close(() => {
      process.exit()
    })
  }

  createWebSocketServer(httpServer: http.Server, socketPath: string): void {
    const hotReloadPluginName = 'htmlgaga-hot-reload'
    this.#wsServer = new WebSocket.Server({
      server: httpServer,
      path: socketPath,
    })

    this.#wsServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        // received data from client
        // we might sync browsers in future
        console.log(`${data} from client`)
      })
    })

    this.#wsServer.on('close', () => {
      console.log('closed')
    })

    process.on('SIGINT', () => this.cleanup())
    process.on('SIGTERM', () => this.cleanup())

    this.#compiler.hooks.done.tap(hotReloadPluginName, (stats) => {
      if (!this.#wsServer) return
      const statsJson = stats.toJson({
        all: false,
        hash: true,
        assets: true,
        warnings: true,
        errors: true,
        errorDetails: false,
      })
      const hasErrors = stats.hasErrors()
      const hasWarnings = stats.hasWarnings()
      this.#wsServer.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) return
        client.send(
          JSON.stringify({
            type: MessageType.HASH,
            data: {
              hash: statsJson.hash,
              startTime: stats.startTime,
              endTime: stats.endTime,
            },
          })
        )
        if (hasErrors) {
          console.log(statsJson.errors)
          return client.send(
            JSON.stringify({
              type: MessageType.ERRORS,
              data: statsJson.errors,
            })
          )
        }
        if (hasWarnings) {
          return client.send(
            JSON.stringify({
              type: MessageType.WARNINGS,
              data: statsJson.warnings,
            })
          )
        }
        client.send(
          JSON.stringify({
            type: MessageType.RELOAD,
          })
        )
      })
    })

    this.#compiler.hooks.invalid.tap(hotReloadPluginName, () => {
      if (!this.#wsServer) return
      this.#wsServer.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) return
        client.send(
          JSON.stringify({
            type: MessageType.INVALID,
          })
        )
      })
    })
  }

  public async start(): Promise<express.Application | void> {
    // collect all pages when server start so we can print pages' table
    logger.info('Collecting pages')
    this.#pages = await collectPages(this.#pagesDir, searchPageEntry)

    if (this.#pages.length === 0) {
      logger.warn(
        'No pages found under `pages`, you might want to add one later'
      )
    }

    const app = express()

    const webpackConfig = this.initWebpackConfig()

    const compiler = webpack(webpackConfig)
    this.#compiler = compiler

    const devMiddlewareInstance = devMiddleware(compiler)

    const socketClient = `${require.resolve('../Client')}`

    app.use((req, res, next) => {
      if (isHtmlRequest(req.url)) {
        // check if page does exit on disk
        const page = this.locateSrc(req.url)

        if (page.exists) {
          const src = page.src as string

          if (!this.#pages.includes(src)) {
            // update pages' table
            this.#pages.push(src)
          }

          const entryKey = getEntryKeyFromRelativePath(this.#pagesDir, src)
          const clientJs = this.searchClientJs(src)

          // if entry not added to webpack yet
          if (!this.#entrypoints[entryKey]) {
            const entries: EntryObject = {
              [entryKey]: [socketClient, src],
            }

            if (clientJs.exists === true) {
              entries[`${entryKey}-client`] = [clientJs.filePath as string]
            }

            this.#entrypoints = {
              ...this.#entrypoints,
              ...entries,
            }
            // @ts-ignore
            // ts reports error because html-webpack-plugin uses types from @types/webpack
            // while we have types from webpack 5
            this.htmlPlugin(src).apply(compiler)
            devMiddlewareInstance.invalidate()
          } else {
            // TODO
            // check if clientJs exists in this.#entrypoints
            if (clientJs.exists === true) {
              if (!this.#entrypoints[`${entryKey}-client`]) {
                // user add a client.js
                // should update this.#entrypoints?
              }
            }
          }
        } else {
          // TODO remove from this.#pages if presented
          res.status(404).end('Page Not Found')
        }
      }
      next()
    })

    app.use(devMiddlewareInstance)

    app.use(express.static(this.#cwd)) // serve statics from ../fixture, etc.

    this.#httpServer = http.createServer(app)
    this.createWebSocketServer(this.#httpServer, socketPath)

    this.#httpServer
      .listen(this.#port, this.#host, () => {
        const server = `http://${this.#host}:${this.#port}`
        const results = this.#pages
          .sort((a, b) => a.split(path.sep).length - b.split(path.sep).length)
          .map((page) => {
            return new Page(
              path.relative(this.#pagesDir, page),
              `${server}/${getFilenameFromRelativePath(this.#pagesDir, page)}`
            )
          })
        console.table(results)
      })
      .on('error', (err) => {
        logger.info(
          `You might run server on another port with option like --port 9999`
        )
        throw err
      })

    return app
  }
}
export default DevServer
