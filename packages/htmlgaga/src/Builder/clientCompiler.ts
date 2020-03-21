import webpack from 'webpack'
import path from 'path'
import TerserJSPlugin from 'terser-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssoWebpackPlugin from 'csso-webpack-plugin'
import WebpackAssetsManifest from 'webpack-assets-manifest'
import Inspector from './Inspector'
import { extensions, alias, clientHtmlFilename } from '../config'
import { rules } from './index'

class PersistPlugin {
  apply(compiler: webpack.Compiler): void {
    compiler.hooks.emit.tap('PersistPlugin', () => {
      // we need to persist some data for next usage
    })
  }
}

export default function clientCompiler(
  entry: string,
  outputPath: string
): webpack.Compiler {
  const config: webpack.Configuration = {
    mode: 'production',
    optimization: {
      minimize: true,
      minimizer: [
        new TerserJSPlugin({
          terserOptions: {},
          extractComments: false
        })
      ],
      splitChunks: {
        cacheGroups: {
          vendors: {
            test: (module): boolean => {
              return (
                /[\\/]node_modules[\\/]/.test(module.resource) &&
                module.type === 'javascript/auto'
              )
            },
            chunks: 'all',
            priority: -10
          }
        }
      }
    },
    entry: {
      client: entry
    },
    output: {
      path: path.resolve(outputPath),
      filename: '[name].[contenthash].js',
      chunkFilename: '[name]-[id].[contenthash].js'
    },
    module: {
      rules
    },
    resolve: {
      extensions,
      alias
    },
    plugins: [
      new PersistPlugin(),
      new HtmlWebpackPlugin({
        minify: false,
        inject: false,
        cache: false,
        showErrors: false,
        meta: false,
        filename: clientHtmlFilename
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"'
      }),
      new CssoWebpackPlugin({
        restructure: false
      }),
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css'
      }),
      new WebpackAssetsManifest({
        output: 'client-assets.json'
      }),
      new Inspector({ name: 'client' }),
      new webpack.NamedChunksPlugin(chunk => {
        // https://github.com/webpack/webpack/issues/1315#issuecomment-386267369
        // TODO remove for webpack 5
        if (chunk.name) {
          return chunk.name
        }

        return [...chunk._modules]
          .map(m =>
            path.relative(
              m.context,
              m.userRequest.substring(0, m.userRequest.lastIndexOf('.'))
            )
          )
          .join('_')
      }),
      new webpack.HashedModuleIdsPlugin()
    ]
  }
  return webpack(config)
}
