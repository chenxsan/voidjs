import webpack from 'webpack'
import { extensions, alias, postcssPlugins } from '../config'
import rehypePrism from '@mapbox/rehype-prism'
import createEntries from './createEntries'
import type { EntryObject } from './index'
import path from 'path'

const createDOMRenderRule = (pagesDir: string, hasApp: boolean) => ({
  include: (filename: string): boolean => {
    // entries under pagesDir
    // exclude client entry
    // exclude files prefixed with _
    return (
      filename.startsWith(pagesDir) &&
      filename.includes('.client.') === false &&
      path.basename(filename).startsWith('_') === false
    )
  },
  plugins: [
    [
      'react-dom-render', // render page entry in dom
      {
        hydrate: false,
        root: 'voidjs-app',
        app: hasApp === true ? path.join(pagesDir, '_app') : hasApp,
      },
    ],
  ],
})

const createBabelOptions = (pagesDir: string, hasApp: boolean) => {
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
      // we support typescript
      '@babel/preset-typescript',
    ],
    plugins: [
      [
        '@babel/plugin-transform-runtime',
        {
          regenerator: true,
        },
      ],
    ],
    overrides: [createDOMRenderRule(pagesDir, hasApp)],
  }
}

export default function createWebpackConfig(
  activePages: string[],
  pagesDir: string,
  hasApp: boolean,
  socketUrl: string
): webpack.Configuration {
  return {
    experiments: {
      topLevelAwait: true,
    },
    devtool: 'eval',
    mode: 'development',
    // TODO should be configurable
    // because people might not care ie 11 like me
    target: ['web', 'es5'], // I need ie 11 support at the moment :(
    // we use function for entry
    // so it would be called every compilation
    // see https://github.com/webpack/webpack/pull/10734#issuecomment-616198739
    entry: (): EntryObject => createEntries(pagesDir, activePages),
    output: {
      publicPath: '/',
    },
    // https://webpack.js.org/configuration/stats/#stats-presets
    stats: 'normal',
    module: {
      rules: [
        {
          test: /\.(mjs|js|jsx|ts|tsx)$/i,
          exclude: [/node_modules/],
          use: [
            {
              loader: 'babel-loader',
              options: createBabelOptions(pagesDir, hasApp),
            },
          ],
        },
        {
          test: /\.(mdx|md)$/,
          use: [
            {
              loader: 'babel-loader',
              options: createBabelOptions(pagesDir, hasApp),
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
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset',
        },
        {
          test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext]',
          },
        },
        {
          test: /\.(sa|sc|c)ss$/i,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  ident: 'postcss',
                  plugins: postcssPlugins,
                },
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
        __WEBSOCKET__: JSON.stringify(socketUrl),
      }),
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.ProgressPlugin({
        profile: true,
      }),
    ],
  }
}
