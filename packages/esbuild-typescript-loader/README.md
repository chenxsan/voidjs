# esbuild-typescript-loader

A simple webpack loader to transform TypeScript with [esbuild](https://esbuild.github.io/), and only transform TypeScript.

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
              sourcemap: true
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
              sourcemap: false
            },
          },
        ],
      },
    ],
  },
}
```
