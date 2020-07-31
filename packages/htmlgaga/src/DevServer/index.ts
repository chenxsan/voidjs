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
import { logger, publicFolder } from '../config'
import express from 'express'
import devMiddleware from 'webpack-dev-middleware'
import http from 'http'
import isHtmlRequest from './isHtmlRequest'
import findRawFile from './findRawFile'
import createWebpackConfig from './createWebpackConfig'
import newHtmlWebpackPlugin from './newHtmlWebpackPlugin'
import watchCompilation from './watchCompilation'
import createWebSocketServer from './createWebSocketServer'
import Builder from '../Builder'
import InjectGlobalScriptsPlugin from '../webpackPlugins/InjectGlobalScriptsPlugin'

export interface EntryObject {
  [index: string]:
    | [string, ...string[]]
    | {
        import: string | string[]
        dependOn: string | string[]
      }
}
export interface Server {
  start(): Promise<express.Application | void>
}

class DevServer extends Builder {
  readonly #host: string
  readonly #port: number
  #pages: string[]
  #httpServer: http.Server

  constructor(
    pagesDir: string,
    { host, port }: { host: string; port: number }
  ) {
    super(pagesDir)
    this.#host = host
    this.#port = port
    this.#pages = []
  }

  private listen() {
    this.#httpServer
      .listen(this.#port, this.#host, () => {
        const server = `http://${this.#host}:${this.#port}`
        console.log(`Listening on ${server}`)
      })
      .on('error', (err) => {
        logger.info(
          `You might run server on another port with option like --port 9999`
        )
        throw err
      })
  }

  public async start(): Promise<express.Application | void> {
    await this.resolveConfig()
    const socketPath = '/__websocket'
    const webpackConfig = createWebpackConfig(
      this.#pages,
      this.pagesDir,
      `${this.#host}:${this.#port}${socketPath}`,
      {
        externals: this.config.globalScripts
          ? this.config.globalScripts.reduce((acc, cur) => {
              acc[cur[0]] = cur[1].global
              return acc
            }, {})
          : [],
      }
    )
    const compiler = webpack(webpackConfig)
    const devMiddlewareInstance = devMiddleware(compiler)
    const app = express()
    const htmlgagaMiddleware = (pagesDir: string) => (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (isHtmlRequest(req.url)) {
        // check if page does exit on disk
        const page = findRawFile(pagesDir, req.url)

        if (page.exists) {
          const src = page.src as string
          if (!this.#pages.includes(src)) {
            // update pages' table
            this.#pages.push(src)
            // @ts-ignore
            // ts reports error because html-webpack-plugin uses types from @types/webpack
            // while we have types from webpack 5
            newHtmlWebpackPlugin(pagesDir, src).apply(compiler)
            new InjectGlobalScriptsPlugin(
              this.config.globalScripts
                ? this.config.globalScripts.map((script) => script[1].src)
                : []
            ).apply(compiler)
            devMiddlewareInstance.invalidate()
          }
        }
      }
      next()
    }
    app.use(htmlgagaMiddleware(this.pagesDir))
    app.use(devMiddlewareInstance)
    const cwd = path.resolve(this.pagesDir, '..')
    app.use(express.static(path.join(cwd, publicFolder))) // serve statics from public folder.
    app.use(function (req, res, next) {
      if (req.is('html')) {
        return res.status(404).end('Page Not Found') // TODO list all pages
      }
      next()
    })

    this.#httpServer = http.createServer(app)
    const wsServer = createWebSocketServer(this.#httpServer, socketPath)
    watchCompilation(compiler, wsServer)
    this.listen()

    return app
  }
}
export default DevServer
