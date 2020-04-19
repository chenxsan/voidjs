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
import hotMiddleware from 'webpack-hot-middleware'

import DynamicEntryPlugin from 'webpack/lib/DynamicEntryPlugin'

// Not exported yet
// import { getNormalizedEntryStatic } from 'webpack/lib/config/normalization'
// copied from webpack/lib/config/normalization
const getNormalizedEntryStatic = (entry) => {
  if (typeof entry === 'string') {
    return {
      main: {
        import: [entry],
      },
    }
  }
  if (Array.isArray(entry)) {
    return {
      main: {
        import: entry,
      },
    }
  }
  /** @type {EntryStaticNormalized} */
  const result = {}
  for (const key of Object.keys(entry)) {
    const value = entry[key]
    if (typeof value === 'string') {
      result[key] = {
        import: [value],
      }
    } else if (Array.isArray(value)) {
      result[key] = {
        import: value,
      }
    } else {
      result[key] = {
        import:
          value.import &&
          (Array.isArray(value.import) ? value.import : [value.import]),
        filename: value.filename,
        dependOn:
          value.dependOn &&
          (Array.isArray(value.dependOn) ? value.dependOn : [value.dependOn]),
        library: value.library,
      }
    }
  }
  return result
}

import isHtmlRequest from './isHtmlRequest'
import findFirstPage from './findFirstPage'

const BUILT = Symbol('built')

class Page {
  page: string
  url: string
  constructor(page: string, url: string) {
    this.page = page
    this.url = url
  }
}

// always reload
const hotClient = 'webpack-hot-middleware/client?reload=true'

class DevServer {
  #cwd: string
  #pagesDir: string
  #host: string
  #port: number
  #pages: string[]
  #entries: {
    [propName: string]: {
      status: symbol
    }
  }

  constructor(pagesDir: string, { host, port }) {
    this.#pagesDir = pagesDir
    this.#cwd = path.resolve(pagesDir, '..')

    this.#host = host
    this.#port = port
  }

  private htmlPlugin(page: string): HtmlWebpackPlugin {
    const filename = getFilenameFromRelativePath(this.#pagesDir, page)
    const entryKey = getEntryKeyFromRelativePath(this.#pagesDir, page)
    const clientJs = this.searchClientJs(page)
    return new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'devTemplate'),
      chunks: clientJs.exists === true ? [entryKey, 'client'] : [entryKey],
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

  private createEntry(
    page: string
  ): {
    [propName: string]: string[]
  } {
    const entryKey = getEntryKeyFromRelativePath(this.#pagesDir, page)
    return {
      [entryKey]: [page, hotClient],
    }
  }

  private initWebpackConfig(page: string): webpack.Configuration {
    // generate entries for pages
    const entries = {
      ...this.createEntry(page),
    }

    const clientJs = this.searchClientJs(page)

    if (clientJs.exists === true) {
      entries['client'] = [clientJs.filePath as string, hotClient]
    }

    return {
      mode: 'development',
      entry: entries,
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
            test: /\.(png|svg|jpg|gif)$/i,
            use: ['file-loader'],
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
        this.htmlPlugin(page),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"development"',
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
    const exts = ['tsx', 'jsx', 'js']
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

  async start(): Promise<express.Application | void> {
    // collect all pages
    logger.info('Collecting pages')
    this.#pages = await collectPages(
      this.#pagesDir,
      (pagePath) =>
        /\.(js|jsx|ts|tsx)$/.test(pagePath) && !pagePath.includes('.client.')
    )

    if (this.#pages.length === 0) {
      return logger.warn('No pages found under `pages`')
    }

    const app = express()

    const firstPage = findFirstPage(this.#pages)

    logger.debug(`firstPage ${firstPage}`)

    const entryKey = getEntryKeyFromRelativePath(this.#pagesDir, firstPage)

    const webpackConfig = this.initWebpackConfig(firstPage)

    this.#entries = {
      [entryKey]: {
        status: BUILT,
      },
    }

    const compiler = webpack(webpackConfig)

    const devMiddlewareInstance = devMiddleware(compiler)

    app.use((req, res, next) => {
      if (isHtmlRequest(req.url)) {
        // check if page does exit
        const page = this.locateSrc(req.url)

        if (page.exists) {
          const src = page.src as string

          if (!this.#pages.includes(src)) {
            this.#pages.push(src)
          }

          const entryKey = getEntryKeyFromRelativePath(this.#pagesDir, src)

          // if entry not added to webpack yet
          if (!this.#entries[entryKey]) {
            const entries = {
              [entryKey]: [src, hotClient],
            }

            const clientJs = this.searchClientJs(src)
            if (clientJs.exists === true) {
              entries['client'] = [clientJs.filePath as string, hotClient]
            }

            new DynamicEntryPlugin(this.#cwd, () =>
              getNormalizedEntryStatic(entries)
            ).apply(compiler)
            this.htmlPlugin(src).apply(compiler)
            devMiddlewareInstance.invalidate()
            devMiddlewareInstance.waitUntilValid(() => {
              // save to this.#entries
              this.#entries = {
                ...this.#entries,
                [entryKey]: {
                  status: BUILT,
                },
              }
              return next()
            })
          } else {
            // already added to webpack
            logger.debug(`${src} was already added to webpack`)
          }
        } else {
          res.status(404).end('Page Not Found')
        }
      }
      next()
    })

    app.use(devMiddlewareInstance)

    app.use(hotMiddleware(compiler))

    app.use(express.static(this.#cwd)) // serve statics from ../fixture

    app
      .listen(this.#port, this.#host, (err) => {
        if (err) {
          return logger.error(err)
        }

        compiler.hooks.done.tap('HTMLGAGA', () => {
          // only print it after webpack done compiling.
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
