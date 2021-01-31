import { transformSync } from '@babel/core'
import { ComponentError } from '.'
import plug from './index'
const opts = {
  plugins: [plug],
  configFile: false,
  compact: true, // All optional newlines and whitespace will be omitted
}
describe('validate component name', () => {
  test('should throw with default class component', () => {
    const code = 'export default class App extends React.Component {}'
    expect(() => transformSync(code, opts)).toThrowError(
      ComponentError.functionComponentOnly
    )
  })
  test('should throw with anonymous function component', () => {
    const code = 'export default function () {};'
    expect(() => transformSync(code, opts)).toThrowError(
      ComponentError.namedFunctionComponentOnly
    )
  })
  test('should throw when naming function `VOID_JS_APP`', () => {
    const code = 'export default function VOID_JS_APP() {};'
    expect(() => transformSync(code, opts)).toThrowError(
      ComponentError.reservedFunctionName
    )
  })
})
test('should import createElement and ReactDOM', () => {
  const code = ''
  const result = transformSync(code, opts)
  if (!result) return
  expect(result.code).toContain(
    `import ReactDOM from"react-dom";import{createElement}from"react";`
  )
})
test('should use hydrate', () => {
  const code = 'export default function App() {}'
  const result = transformSync(code, {
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
test('should test against getStaticProps', () => {
  const code = `export default function App() {}`
  const result = transformSync(code, opts)
  if (!result) return
  expect(result.code).toContain('typeof getStaticProps')
})
describe('option `app`', () => {
  it('should not import app', () => {
    const code = `export default function App() {}`
    const result = transformSync(code, {
      ...opts,
      plugins: [
        [
          plug,
          {
            app: false,
          },
        ],
      ],
    })
    if (!result) return
    expect(result.code).toContain('if(false)')
  })
  it('should import app', () => {
    const code = `export default function App() {}`
    const result = transformSync(code, {
      ...opts,
      plugins: [
        [
          plug,
          {
            app: '/path/to/app',
          },
        ],
      ],
    })
    if (!result) return
    expect(result.code).toContain('if(true)')
  })
})
