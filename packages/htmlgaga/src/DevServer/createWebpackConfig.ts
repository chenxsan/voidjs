import webpack from 'webpack'
import { extensions, alias } from '../config'
import rehypePrism from '@mapbox/rehype-prism'
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
        root: 'htmlgaga-app',
      },
    ],
  ],
})
export default function createWebpackConfig(
  entry: () => EntryObject,
  pagesDir: string,
  socketUrl: string
): webpack.Configuration {
  return {
    experiments: {
      asset: true,
    },
    mode: 'development',
    entry: entry,
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
              options: {
                presets: [
                  '@babel/preset-env',
                  '@babel/preset-react',
                  '@babel/preset-typescript',
                ],
                plugins: ['react-require'], // inject React automatically when jsx presented
                overrides: [createDOMRenderRule(pagesDir)],
              },
            },
          ],
        },
        {
          test: /\.(mdx|md)$/,
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
                overrides: [createDOMRenderRule(pagesDir)],
              },
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
          test: /\.(png|svg|jpg|gif)$/i,
          type: 'asset',
        },
        {
          test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
          use: [
            {
              loader: 'file-loader', // TODO replace file-loader with asset module
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
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"development"',
        __WEBSOCKET__: JSON.stringify(socketUrl),
      }),
      new webpack.NoEmitOnErrorsPlugin(),
    ],
  }
}
