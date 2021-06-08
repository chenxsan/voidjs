import webpack from 'webpack'
import {
  resolveExtensions,
  alias,
  postcssPlugins,
  supportedImageExtensions,
  supportedFontExtensions,
  supportedCssExtensions,
  xdmLoader,
} from '../config'
import createEntries from './createEntries'
import path from 'path'
import isPageEntry from '../utils/isPageEntry'

import type { RuleSetRule, Configuration } from 'webpack'

const createDOMRenderRule = (pagesDir: string, hasCustomApp: boolean) => ({
  include: (filename: string): boolean => isPageEntry(pagesDir, filename),
  plugins: [
    [
      'react-dom-render',
      {
        hydrate: false,
        root: 'voidjs-app',
        app: hasCustomApp === true ? '_app' : hasCustomApp,
      },
    ],
  ],
})

const createBabelOptions = (pagesDir: string, hasCustomApp: boolean) => {
  return {
    presets: [
      '@babel/preset-env',
      [
        '@babel/preset-react',
        {
          // we support usage like alpinejs
          throwIfNamespace: false,

          // we support new jsx transform introduced in React 17
          runtime: 'automatic',
        },
      ],
    ],
    plugins: [
      [
        '@babel/plugin-transform-runtime',
        {
          regenerator: true,
        },
      ],
    ],
    overrides: [createDOMRenderRule(pagesDir, hasCustomApp)],
  }
}
export default function createWebpackConfig(
  activePages: string[],
  pagesDir: string,
  hasCustomApp: boolean,
  socketUrl: string
): Configuration {
  const babelLoader: RuleSetRule = {
    loader: 'babel-loader',
    options: createBabelOptions(pagesDir, hasCustomApp),
  }

  return {
    experiments: {
      topLevelAwait: true,
    },
    // TODO disable at the moment as I'm not yet wrap my head around it
    // cache: {
    //   type: 'filesystem',
    //   buildDependencies: {
    //     // https://github.com/webpack/changelog-v5/blob/master/guides/persistent-caching.md
    //     pages: [path.resolve(pagesDir, path.sep)],
    //     // FIXME might have bugs
    //   },
    // },
    devtool: 'eval',
    mode: 'development',
    // TODO should be configurable
    // because people might not care ie 11 like me
    target: ['web', 'es5'], // I need ie 11 support at the moment :(
    // we use function for entry
    // so it would be called every compilation
    // see https://github.com/webpack/webpack/pull/10734#issuecomment-616198739
    entry: () => createEntries(pagesDir, activePages),
    output: {
      publicPath: '/',
    },
    // https://webpack.js.org/configuration/stats/#stats-presets
    stats: 'normal',
    module: {
      rules: [
        {
          test: /\.(mjs|js|jsx)$/i,
          exclude: [/node_modules/],
          use: [babelLoader],
        },
        {
          test: /\.ts$/i,
          exclude: [/node_modules/],
          use: [
            babelLoader,
            {
              loader: 'esbuild-typescript-loader',
              options: {
                loader: 'ts',
              },
            },
          ],
        },
        {
          test: /\.tsx$/i,
          exclude: [/node_modules/],
          use: [
            babelLoader,
            {
              loader: 'esbuild-typescript-loader',
              options: {
                loader: 'tsx',
              },
            },
          ],
        },
        {
          test: /\.(mdx|md)$/,
          use: [babelLoader, xdmLoader],
        },
        {
          test: supportedImageExtensions,
          type: 'asset',
        },
        {
          test: supportedFontExtensions,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext]',
          },
        },
        {
          test: supportedCssExtensions,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader', // FIXME this is slow, might be related to tailwindcss https://github.com/tailwindlabs/tailwindcss/issues/2544#issuecomment-710974396
              options: {
                postcssOptions: {
                  ident: 'postcss',
                  plugins: postcssPlugins,
                },
              },
            },
            'sass-loader', // built-in sass support
          ],
        },
      ],
    },
    resolve: {
      extensions: resolveExtensions,
      alias, // TODO we should let users configure this
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"development"',
        __WEBSOCKET__: JSON.stringify(socketUrl),
      }),
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.ProgressPlugin({
        profile: true, // enable profiling
      }),
    ],
  }
}
