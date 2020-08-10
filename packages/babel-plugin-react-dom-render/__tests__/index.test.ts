import { transform } from '@babel/core';
import plug from '../src/index';
test('should import react-dom when React presented and default exported', () => {
  const str = 'import React from "react";export default function App() {}';
  const result = transform(str, {
    plugins: [plug]
  });
  if (!result) return;
  expect(result.code).toContain(
    'import ReactDOM from "react-dom";\nimport React from "react";\nexport default function App() {}\nReactDOM.render(React.createElement(App), document.getElementById("app"))'
  );
});
test('should not render class component', () => {
  const str = 'export default class App extends React.Component {}';
  const result = transform(str, {
    plugins: [plug]
  });
  if (!result) return;
  expect(result.code).not.toContain('ReactDOM.render');
});
test('should hydrate', () => {
  const str = 'import React from "react";export default function App() {}';
  const result = transform(str, {
    plugins: [
      [
        plug,
        {
          hydrate: true
        }
      ]
    ]
  });
  if (!result) return;
  expect(result.code).toContain('ReactDOM.hydrate');
});
test('should not do anything if no React present', () => {
  const str = 'export default function App() {}';
  const result = transform(str, {
    plugins: [[plug]]
  });
  if (!result) return;
  expect(result.code).not.toContain('ReactDOM');
});
