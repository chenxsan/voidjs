import { transformSync } from '@babel/core'
import plug from './index'
const opts = {
  plugins: [plug],
  configFile: false,
  compact: true,
}
test('should import createElement and ReactDOM', () => {
  const str = ''
  const result = transformSync(str, opts)
  if (!result) return
  expect(result.code).toContain(
    `import ReactDOM from"react-dom";import{createElement}from'react';`
  )
})
test('should throw with default class component', () => {
  const str = 'export default class App extends React.Component {}'
  expect(() => transformSync(str, opts)).toThrowError()
})
test('should hydrate', () => {
  const str = 'export default function App() {}'
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
test('should test existence of getStaticProps', () => {
  const str = `export default function App() {}`
  const result = transformSync(str, opts)
  if (!result) return
  expect(result.code).toContain('typeof getStaticProps')
})
