import webpack = require('webpack');
import * as path from 'path';
import * as fs from 'fs';
import HtmlWebpackPlugin = require('html-webpack-plugin');
import collectPages from '../collectPages';
import getEntryKeyFromRelativePath from './getEntryKeyFromRelativePath';
import getFilenameFromRelativePath from './getFilenameFromRelativePath';
import { cwd, extensions, alias, logger } from '../config';

import express = require('express');
import devMiddleware = require('webpack-dev-middleware');
import hotMiddleware = require('webpack-hot-middleware');

// always reload
const hotClient = 'webpack-hot-middleware/client?reload=true';
class DevServer {
  private pagesDir: string;
  private pages: string[];

  constructor(pagesDir: string) {
    this.pagesDir = pagesDir;
  }

  private createWebpackConfig(): any {
    const hasClientJs = fs.existsSync(path.join(cwd, 'public/js/index.js'));

    // generate entries for pages
    const entries = this.pages.reduce((acc, page) => {
      const entryKey = getEntryKeyFromRelativePath(this.pagesDir, page);
      acc[entryKey] = [page, hotClient];
      return acc;
    }, {});

    if (hasClientJs) {
      entries['client'] = [path.resolve(cwd, 'public/js/index'), hotClient];
    }
    // generate htmlwebpackplugins for pages
    const htmlPlugins = this.pages.map(page => {
      const filename = getFilenameFromRelativePath(this.pagesDir, page);
      const entryKey = getEntryKeyFromRelativePath(this.pagesDir, page);
      return new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../templates/dev.js'),
        chunks: hasClientJs ? [entryKey, 'client'] : [entryKey],
        filename,
        title: `htmlgaga - ${filename}`
      });
    });
    return {
      mode: 'development',
      entry: entries,
      output: {
        publicPath: '/'
      },
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
        ...htmlPlugins,
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': '"development"'
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
      ]
    };
  }
  async start(): Promise<any> {
    const pages: string[] = await collectPages(this.pagesDir);
    this.pages = pages.slice(0, 1);
    if (pages.length === 0) {
      return logger.warn('No pages found under `pages`');
    }

    const app = express();

    const webpackConfig = this.createWebpackConfig();

    const compiler = webpack(webpackConfig);

    app.use(
      devMiddleware(compiler, {
        stats: 'minimal'
      })
    );

    app.use(hotMiddleware(compiler));

    app.use(express.static(cwd)); // serve statics from placeholder

    return app;
  }
}
export default DevServer;
