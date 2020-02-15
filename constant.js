const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const dev = process.env.NODE_ENV !== 'production'

const rules = [
  {
    test: /\.(js|jsx|ts|tsx)$/i,
    exclude: /node_modules/,
    loader: 'babel-loader'
  },
  {
    test: /\.css$/i,
    use: [
      {
        loader: MiniCssExtractPlugin.loader,
        options: {
          hmr: dev
        }
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
  },
  {
    test: /\.(png|svg|jpg|gif)$/i,
    use: [
      'file-loader',
      {
        loader: 'image-webpack-loader'
      }
    ]
  }
]
const plugins = [
  new MiniCssExtractPlugin({
    filename: dev ? '[name].css' : '[name].[contenthash].css',
    chunkFilename: dev ? '[id].css' : '[id].[contenthash].css'
  }),
  new CleanWebpackPlugin()
]

const extensions = ['.tsx', '.ts', '.js', '.jsx']

exports.rules = rules
exports.plugins = plugins
exports.extensions = extensions
exports.dev = dev
