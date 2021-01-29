# babel-plugin-react-dom-render

Rendering the default React.js Component with `ReactDOM.render` for you.

## Usage

```js
{
  test: /\.(js|jsx|ts|tsx|mjs)\$/i,
  include: [path.resolve(__dirname, 'pages')],
  use: [
    {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react'],
        plugins: [
          ['react-dom-render', { hydrate: false, root: 'app' }]
        ]
      }
    }
  ]
},
```

## Example

Before:

```jsx
import React from 'react';
export default function App() {
  return <div>hello babel-plugin-react-dom-render</div>;
}
```

After:

```jsx
import ReactDOM from 'react-dom';
import React from 'react';
export default function App() {
  return <div>hello babel-plugin-react-dom-render</div>;
}
ReactDOM.render(<App />, document.getElementById('app'));
```
