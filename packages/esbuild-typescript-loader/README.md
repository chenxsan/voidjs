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

  [Target environment](https://esbuild.github.io/api/#target) for the generated JavaScript code.

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
