# esbuild-typescript-loader

A webpack loader to transform TypeScript with [esbuild](https://esbuild.github.io/).

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
            },
          },
        ],
      },
    ],
  },
}
```
