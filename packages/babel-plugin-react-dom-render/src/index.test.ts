import { transformSync } from '@babel/core'
import plug from './index'
const opts = {
  plugins: [plug],
  configFile: false,
  compact: true,
}
test('should import react-dom when React presented and default exported', () => {
  const str = 'import React from "react";export default function App() {};'
  const result = transformSync(str, opts)
  if (!result) return
  expect(result.code).toContain(
    'import ReactDOM from"react-dom";import React from"react";export default function App(){};if(typeof getStaticProps!=="undefined"){(async function(){const data=await getStaticProps();ReactDOM.render(React.createElement(App,data.props),document.getElementById("app"));})();}else{ReactDOM.render(React.createElement(App),document.getElementById("app"));}'
  )
})
test('should throw with default class component', () => {
  const str = 'export default class App extends React.Component {}'
  expect(() => transformSync(str, opts)).toThrowError()
})
test('should hydrate', () => {
  const str = 'import React from "react";export default function App() {}'
  const result = transformSync(str, {
    ...opts,
    plugins: [
      [
        plug,
        {
          hydrate: true,
        },
      ],
    ],
  })
  if (!result) return
  expect(result.code).toContain('ReactDOM.hydrate')
})
test('should not do anything if no React present', () => {
  const str = 'export default function App() {}'
  const result = transformSync(str, opts)
  if (!result) return
  expect(result.code).not.toContain('ReactDOM')
})
test('should test existence of getStaticProps', () => {
  const str = `import React from 'react';export default function App() {}`
  const result = transformSync(str, opts)
  if (!result) return
  expect(result.code).toContain('typeof getStaticProps')
})
