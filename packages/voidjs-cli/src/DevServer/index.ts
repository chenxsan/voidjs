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
import { logger, publicFolder } from '../config'
import express from 'express'
import webpackDevMiddleware from 'webpack-dev-middleware'
import http from 'http'
import isHtmlRequest from './isHtmlRequest'
import findSourceFile from './findSourceFile'
import createWebpackConfig from './createWebpackConfig'
import watchCompilation from './watchCompilation'
import createWebSocketServer from './createWebSocketServer'
import Builder from '../Builder'
import HtmlPlugin from '../webpack-plugins/HtmlPluginForDevServer'

export interface EntryObject {
  [index: string]:
    | [string, ...string[]]
    | {
        import: string | string[]
        dependOn: string | string[]
      }
}

export interface Server {
  start(): Promise<http.Server>
}

export default class DevServer extends Builder {
  readonly #host: string
  readonly #port: number

  // collect activated pages
  #activePages: string[]

  constructor(
    pagesDir: string,
    { host, port }: { host: string; port: number }
  ) {
    super(pagesDir)

    this.#host = host
    this.#port = port

    this.#activePages = []
  }

  public async start(): Promise<http.Server> {
    // resolve voidjs.config.js
    await this.resolveConfig()

    const socketPath = '/__websocket'

    const webpackConfig = createWebpackConfig(
      this.#activePages,
      this.pagesDir,
      `${this.#host}:${this.#port}${socketPath}`
    )
    const compiler = webpack(webpackConfig)

    const devMiddleware = webpackDevMiddleware(compiler)
    const voidjsMiddleware = (pagesDir: string) => (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction
    ) => {
      // requesting html page
      if (isHtmlRequest(req.url)) {
        // check if page does exit on disk
        // FIXME what if req.url contains query
        const page = findSourceFile(pagesDir, req.url)

        if (page.exists) {
          const src = page.src as string
          if (!this.#activePages.includes(src)) {
            this.#activePages.push(src)
            new HtmlPlugin(pagesDir, src).apply(compiler)
            devMiddleware.invalidate()
          }
        }
      }
      next()
    }

    const app = express()
    /**
     * rewrite html request
     */
    app.use(function (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction
    ) {
      // we only want to rewrite url for html request
      if (req.url.endsWith('/')) {
        req.url = req.url + 'index.html'
      } else {
        // req.url contains no extension
        if (!/\..+/.test(req.url)) {
          req.url = req.url + '.html'
        }
      }
      next()
    })
    app.use(voidjsMiddleware(this.pagesDir))
    app.use(devMiddleware)

    // serve statics from public folder.
    app.use(express.static(path.join(this.pagesDir, '..', publicFolder)))

    app.use(function (req, res, next) {
      if (req.url.endsWith('.html')) {
        // TODO we might list all pages available
        return res.status(404).end('Page Not Found')
      }
      next()
    })

    const httpServer = http.createServer(app)
    const wsServer = createWebSocketServer(httpServer, socketPath)

    watchCompilation(compiler, wsServer)

    return httpServer
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
}
