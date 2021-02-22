# esbuild-typescript-loader

A simple webpack loader to transform TypeScript with [esbuild](https://esbuild.github.io/), and only transform TypeScript.

## Options

- `loader`

  Change how a given input file is interpreted.

  - Type: `'ts'|'tsx'`

- `sourcemap`

  Generate source map.

  - Type: `boolean`

- `target`

  Target environment for the generated JavaScript code.

  - Type: `"chrome"|"firefox"|"safari"|"edge"|"node"|"es6"|"es2016"|"es2017"|"es2018"|"es2019"|"es2020"|"esnext"`

## Example

`webpack.config.js`:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/i,
        exclude: [/node_modules/],
        use: [
          'babel-loader',
          {
            loader: 'esbuild-typescript-loader',
            options: {
              loader: 'ts',
              sourcemap: true,
            },
          },
        ],
      },
      {
        test: /\.tsx$/i,
        exclude: [/node_modules/],
        use: [
          'babel-loader',
          {
            loader: 'esbuild-typescript-loader',
            options: {
              loader: 'tsx',
              sourcemap: false,
            },
          },
        ],
      },
    ],
  },
}
```
