import webpack = require('webpack');
import * as path from 'path';
import * as fs from 'fs';
import HtmlWebpackPlugin = require('html-webpack-plugin');
import TerserJSPlugin = require('terser-webpack-plugin');
import MiniCssExtractPlugin = require('mini-css-extract-plugin');
import CssoWebpackPlugin from 'csso-webpack-plugin';
import WebpackAssetsManifest = require('webpack-assets-manifest');
import getHtmlFilenameFromRelativePath from './dev/getFilenameFromRelativePath';
import {
  extensions,
  alias,
  logger,
  cwd,
  performance,
  PerformanceObserver
} from './config';

import collectPages from './collectPages';

import SsrPlugin from './ssrPlugin';

class Builder {
  pagesDir: string;
  outputPath: string;
  constructor(pagesDir: string, outputPath: string) {
    this.pagesDir = pagesDir;
    this.outputPath = outputPath;
  }
  normalizedPageEntry(pageEntry): string {
    return path
      .relative(this.pagesDir, pageEntry)
      .split(path.sep)
      .join('-');
  }
  createWebpackConfig(pages) {
    // {[outputHtml]: input}
    // ssrPlugin needs it
    const outputMapInput = pages.reduce((acc, pageEntry) => {
      const outputHtml = getHtmlFilenameFromRelativePath(
        this.pagesDir,
        pageEntry
      );
      acc[outputHtml] = this.normalizedPageEntry(pageEntry);
      return acc;
    }, {});

    const entries = pages.reduce((acc, page) => {
      acc[this.normalizedPageEntry(page)] = page;
      return acc;
    }, {});

    const htmlPlugins = pages.map(page => {
      const filename = getHtmlFilenameFromRelativePath(this.pagesDir, page);
      return new HtmlWebpackPlugin({
        chunks: [this.normalizedPageEntry(page), 'client'], // <- needs to exclude [name].js later
        filename,
        meta: {
          'utf-8': {
            charset: 'utf-8'
          },
          viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
          generator: 'htmlgaga'
        },
        minify: false,
        inject: false,
        cache: false,
        showErrors: false
      });
    });

    let webpackEntry = { ...entries };
    const clientJs = path.resolve(cwd, 'public/js/index.js');
    if (fs.existsSync(clientJs)) {
      webpackEntry = { ...webpackEntry, client: clientJs };
    }

    return {
      mode: 'production',
      optimization: {
        minimize: true,
        minimizer: [
          new TerserJSPlugin({
            terserOptions: {},
            extractComments: false
          })
        ]
      },
      entry: webpackEntry,
      output: {
        path: path.resolve(this.outputPath),
        libraryTarget: 'umd',
        globalObject: 'this',
        filename: (chunkData): string => {
          if (entries[chunkData.chunk.name]) {
            // do not include contenthash for those entry pages
            // since we only use it for server side render
            return '[name]';
          }
          return '[name].[contenthash].js';
        }
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
            test: /\.css$/i,
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
        new WebpackAssetsManifest({
          output: 'assets.json'
        }),
        new CssoWebpackPlugin({
          restructure: false
        }),
        ...htmlPlugins,
        new SsrPlugin({
          outputMapInput: outputMapInput
        }),
        new MiniCssExtractPlugin({
          filename: '[contenthash].css'
        })
      ]
    };
  }
  async run(): Promise<void> {
    performance.mark('begin');
    logger.info('Collecting pages...');
    const pages = await collectPages(this.pagesDir);
    logger.info(`${pages.length} pages collected`);

    logger.info('Building now, please wait...');

    const compiler = webpack(this.createWebpackConfig(pages));

    compiler.run((err, stats) => {
      if (err) {
        if (err.details) {
          logger.error(err.details);
        }
        return;
      }
      if (stats.hasErrors()) {
        return stats.toJson().errors.forEach(err => logger.error(err));
      }
      performance.mark('end');
      performance.measure('begin to end', 'begin', 'end');
      const obs = new PerformanceObserver((list, observer) => {
        logger.info(
          `All ${pages.length} pages built in ${(
            list.getEntries()[0].duration / 1000
          ).toFixed(2)}s!`
        );

        observer.disconnect();
      });
      obs.observe({ entryTypes: ['measure'] });
      performance.measure('Build time', 'begin', 'end');
    });
  }
}
export default Builder;
