import webpack from 'webpack'
import { extensions, alias, postcssPlugins } from '../config'
import rehypePrism from '@mapbox/rehype-prism'
import createEntries from './createEntries'
import type { EntryObject } from './index'

const createDOMRenderRule = (pagesDir: string) => ({
  include: (filename: string): boolean => {
    return (
      filename.startsWith(pagesDir) && filename.includes('.client.') === false // entries under pagesDir // exclude client entry
    )
  },
  plugins: [
    [
      'react-dom-render', // render page entry in dom
      {
        hydrate: false,
        root: 'voidjs-app',
      },
    ],
  ],
})

const createBabelOptions = (pagesDir: string) => {
  return {
    presets: [
      '@babel/preset-env',
      [
        '@babel/preset-react',
        {
          throwIfNamespace: false,
          runtime: 'automatic',
        },
      ],
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
    overrides: [createDOMRenderRule(pagesDir)],
  }
}

export default function createWebpackConfig(
  pages: string[],
  pagesDir: string,
  socketUrl: string,
  options
): webpack.Configuration {
  return {
    experiments: {
      topLevelAwait: true,
    },
    mode: 'development',
    target: ['web', 'es5'], // I need ie 11 support :(
    entry: (): EntryObject => createEntries(pagesDir, pages),
    output: {
      publicPath: '/',
    },
    stats: 'minimal',
    module: {
      rules: [
        {
          test: /\.(mjs|js|jsx|ts|tsx)$/i,
          exclude: [/node_modules/],
          use: [
            {
              loader: 'babel-loader',
              options: createBabelOptions(pagesDir),
            },
          ],
        },
        {
          test: /\.(mdx|md)$/,
          use: [
            {
              loader: 'babel-loader',
              options: createBabelOptions(pagesDir),
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
    ],
    ...options,
  }
}
