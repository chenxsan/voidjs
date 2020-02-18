const path = require('path')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const dev = process.env.NODE_ENV !== 'production'

const rules = [
  {
    test: /\.(js|jsx|ts|tsx|mjs)$/i,
    exclude: /node_modules/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: ['react-require']
        }
      }
    ]
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

const extensions = ['.js', '.jsx', 'ts', 'tsx', 'mjs']

const logger = require('pino')({
  prettyPrint: {
    translateTime: true,
    ignore: 'pid,hostname'
  }
})

const cwd = process.cwd()
const alias = {
  img: path.resolve(cwd, 'static/img'),
  css: path.resolve(cwd, 'static/css')
}
exports.rules = rules
exports.plugins = plugins
exports.extensions = extensions
exports.dev = dev
exports.logger = logger
exports.alias = alias
