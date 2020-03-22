import webpack from 'webpack'
import path from 'path'
import TerserJSPlugin from 'terser-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssoWebpackPlugin from 'csso-webpack-plugin'
import WebpackAssetsManifest from 'webpack-assets-manifest'
import { extensions, alias, rules, logger } from '../config'
import RemoveAssetsPlugin from '../webpackPlugins/RemoveAssetsPlugin'
import PersistDataPlugin from '../webpackPlugins/PersistDataPlugin'

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
          extractComments: false,
        }),
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
            priority: -10,
          },
        },
      },
    },
    entry: {
      client: entry,
    },
    output: {
      path: path.resolve(outputPath),
      filename: '[name].[contenthash].js',
      chunkFilename: '[name]-[id].[contenthash].js',
    },
    module: {
      rules,
    },
    resolve: {
      extensions,
      alias,
    },
    plugins: [
      new PersistDataPlugin(),
      // we use htmlwebpackplugin only for data collecting
      // so we'll remove its html file with RemoveAssetsPlugin
      // might rewrite with own codes in the future
      new HtmlWebpackPlugin({
        minify: false,
        inject: false,
        cache: false,
        showErrors: false,
        meta: false,
        filename: 'client.html',
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"',
      }),
      new CssoWebpackPlugin({
        restructure: false,
      }),
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
      }),
      new WebpackAssetsManifest({
        output: 'client-assets.json',
      }),
      new RemoveAssetsPlugin(
        (filename) => filename === 'client.html',
        (filename) => logger.debug(`${filename} removed by RemoveAssetsPlugin`)
      ),
      new webpack.NamedChunksPlugin((chunk) => {
        // https://github.com/webpack/webpack/issues/1315#issuecomment-386267369
        // TODO remove for webpack 5
        if (chunk.name) {
          return chunk.name
        }

        return [...chunk._modules]
          .map((m) =>
            path.relative(
              m.context,
              m.userRequest.substring(0, m.userRequest.lastIndexOf('.'))
            )
          )
          .join('_')
      }),
      new webpack.HashedModuleIdsPlugin(),
    ],
  }
  return webpack(config)
}
