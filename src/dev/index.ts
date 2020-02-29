import webpack = require('webpack');
import * as path from 'path';
import * as fs from 'fs';
import WebpackDevServer = require('webpack-dev-server');
import HtmlWebpackPlugin = require('html-webpack-plugin');
import collectPages from '../collectPages';
import getEntryKeyFromRelativePath from './getEntryKeyFromRelativePath';
import getFilenameFromRelativePath from './getFilenameFromRelativePath';
import { cwd, extensions, alias, logger } from '../config';
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
      acc[entryKey] = [page];
      return acc;
    }, {});

    if (hasClientJs) {
      entries['client'] = path.resolve(cwd, 'public/js/index');
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
        })
      ]
    };
  }
  async start(): Promise<any> {
    const pages = await collectPages(this.pagesDir);
    this.pages = pages;
    if (pages.length === 0) {
      return logger.warn('No pages found under `pages`');
    }

    const webpackConfig = this.createWebpackConfig();

    const compiler = webpack(webpackConfig);

    return new WebpackDevServer(compiler, {
      stats: 'minimal'
    });
  }
}
export default DevServer;
