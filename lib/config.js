const path = require('path')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const jsRule = {
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
}
const imgRule = {
  test: /\.(png|svg|jpg|gif)$/i,
  use: [
    'file-loader',
    {
      loader: 'image-webpack-loader'
    }
  ]
}

const plugins = [
  new MiniCssExtractPlugin({
    filename: '[name].[contenthash].css',
    chunkFilename: '[id].[contenthash].css'
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
exports.logger = logger

exports.devConfig = {
  mode: 'development',
  module: {
    rules: [
      jsRule,
      imgRule,
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
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'HTML gaga',
      template: path.resolve(__dirname, 'templates/dev.html')
    })
  ]
}

exports.prodConfig = {
  mode: 'production',
  target: 'node',
  optimization: {
    minimizer: [new OptimizeCSSAssetsPlugin({})]
  },
  module: {
    rules: [
      jsRule,
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
      },
      imgRule
    ]
  },
  resolve: {
    extensions,
    alias
  },
  plugins
}
