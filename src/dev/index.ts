import webpack = require('webpack');
import * as path from 'path';
import * as fs from 'fs';
import HtmlWebpackPlugin = require('html-webpack-plugin');
import collectPages from '../collectPages';
import getEntryKeyFromRelativePath from './getEntryKeyFromRelativePath';
import getFilenameFromRelativePath from './getFilenameFromRelativePath';
import { cwd, extensions, alias, logger } from '../config';

import express = require('express');
import devMiddleware from 'webpack-dev-middleware';
import hotMiddleware = require('webpack-hot-middleware');

import MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin');

import isHtmlRequest from './isHtmlRequest';

const BUILT = Symbol('built');

// always reload
const hotClient = 'webpack-hot-middleware/client?reload=true';
class DevServer {
  private pagesDir: string;
  private pages: string[];
  private entries: {
    [propName: string]: any;
  };
  private hasClientJs: boolean;
  private host: string;
  private port: number;

  constructor(pagesDir: string, { host, port }) {
    this.pagesDir = pagesDir;
    this.hasClientJs = fs.existsSync(path.join(cwd, 'public/js/index.js'));

    this.host = host;
    this.port = port;
  }

  private htmlPlugin(page: string): HtmlWebpackPlugin {
    const filename = getFilenameFromRelativePath(this.pagesDir, page);
    const entryKey = getEntryKeyFromRelativePath(this.pagesDir, page);
    return new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../templates/dev.js'),
      chunks: this.hasClientJs ? [entryKey, 'client'] : [entryKey],
      chunksSortMode: 'manual',
      filename,
      title: `htmlgaga - ${filename}`
    });
  }

  private createEntry(
    page: string
  ): {
    [propName: string]: string[];
  } {
    const entryKey = getEntryKeyFromRelativePath(this.pagesDir, page);
    return {
      [entryKey]: [page, hotClient]
    };
  }

  private initWebpackConfig(page: string): webpack.Configuration {
    // generate entries for pages
    const entries = {
      ...this.createEntry(page)
    };

    if (this.hasClientJs) {
      entries['client'] = [path.resolve(cwd, 'public/js/index'), hotClient];
    }

    return {
      mode: 'development',
      entry: entries,
      output: {
        publicPath: '/'
      },
      stats: 'minimal',
      module: {
        rules: [
          {
            test: /\.(js|jsx|ts|tsx|mjs)$/i,
            exclude: [/node_modules/],
            use: [
              {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env', '@babel/preset-react'],
                  plugins: ['react-require'],
                  overrides: [
                    {
                      include: path.resolve(cwd, 'pages'),
                      plugins: [
                        [
                          'react-dom-render',
                          {
                            hydrate: false,
                            root: 'htmlgaga'
                          }
                        ]
                      ]
                    }
                  ]
                }
              }
            ]
          },
          {
            test: /\.(png|svg|jpg|gif)$/i,
            use: ['file-loader']
          },
          {
            test: /\.css$/i,
            use: [
              'style-loader',
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  ident: 'postcss',
                  plugins: [require('tailwindcss'), require('autoprefixer')]
                }
              }
            ]
          }
        ]
      },
      resolve: {
        extensions,
        alias
      },
      plugins: [
        this.htmlPlugin(page),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"development"'
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
      ]
    };
  }

  private findSrcPage(url: string): string {
    if (url.endsWith('/')) url = url + '/index.html';
    const target = path.join(this.pagesDir, url.replace(/\.html$/, '') + '.js');
    if (fs.existsSync(target)) {
      return target;
    }
    return '';
  }

  async start(): Promise<any> {
    // collect all pages
    this.pages = await collectPages(this.pagesDir);

    if (this.pages.length === 0) {
      return logger.warn('No pages found under `pages`');
    }

    const app = express();

    const entryKey = getEntryKeyFromRelativePath(this.pagesDir, this.pages[0]);

    const webpackConfig = this.initWebpackConfig(this.pages[0]);

    this.entries = {
      [entryKey]: {
        status: BUILT
      }
    };

    const compiler = webpack(webpackConfig);

    const middleware = devMiddleware(compiler);

    app.use((req, res, next) => {
      if (isHtmlRequest(req.url)) {
        // check if page does exit
        const page = this.findSrcPage(req.url);
        const entryKey = getEntryKeyFromRelativePath(this.pagesDir, page);

        if (page !== '') {
          // if entry not added to webpack
          if (!this.entries[entryKey]) {
            new MultiEntryPlugin(cwd, [page, hotClient], entryKey).apply(
              compiler
            );

            this.htmlPlugin(page).apply(compiler);
            middleware.invalidate();

            // save to this.entries
            this.entries = {
              ...this.entries,
              [entryKey]: {
                status: BUILT
              }
            };
          }
        } else {
          // page not exist now
          if (this.entries[entryKey]) {
            delete this.entries[entryKey];
          }
          res.status(404).end('Page Not Found');
        }
      }
      next();
    });

    app.use(middleware);

    app.use(hotMiddleware(compiler));

    app.use(express.static(cwd)); // serve statics from ../fixture

    app
      .listen(this.port, this.host, err => {
        if (err) {
          return logger.error(err);
        }

        const server = `http://${this.host}:${this.port}`;
        logger.info(`Starting server on ${server}`);

        logger.info(
          `${server}/${getFilenameFromRelativePath(
            this.pagesDir,
            this.pages[0]
          )} is ready`
        );
      })
      .on('error', err => {
        logger.info('You might run server on another port with option --port');
        throw err;
      });

    return app;
  }
}
export default DevServer;
