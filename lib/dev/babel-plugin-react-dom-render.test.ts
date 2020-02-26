import { transform } from '@babel/core';
import plug from './babel-plugin-react-dom-render';
test('should import react-dom', () => {
  const str = 'export default function App() {}';
  const result = transform(str, {
    plugins: [plug]
  });
  expect(result.code).toContain(
    'import ReactDOM from "react-dom";\nexport default function App() {}\nReactDOM.render(React.createElement(App), document.getElementById("app"))'
  );
});
test('should not render class component', () => {
  const str = 'export default class App extends React.Component {}';
  const result = transform(str, {
    plugins: [plug]
  });
  expect(result.code).not.toContain('ReactDOM.render');
});
test('should hydrate', () => {
  const str = 'export default function App() {}';
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
  expect(result.code).toContain('ReactDOM.hydrate');
});
