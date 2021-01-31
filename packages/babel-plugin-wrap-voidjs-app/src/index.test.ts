import { transformSync } from '@babel/core'
import { ComponentError } from '.'
import plug from './index'
const opts = {
  plugins: [plug],
  configFile: false,
  compact: true, // All optional newlines and whitespace will be omitted
}

describe('babel-plugin-wrap-voidjs-app', () => {
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
    test('should throw when naming function `VoidJsPage`', () => {
      const code = 'export default function VoidJsPage() {};'
      expect(() => transformSync(code, opts)).toThrowError(
        ComponentError.reservedFunctionName
      )
    })
  })

  test('should import createElement', () => {
    const code = ''
    const result = transformSync(code, opts)
    if (!result) return
    expect(result.code).toContain(`import{createElement}from"react";`)
  })

  describe('option app', () => {
    it('should export VoidJsPage', () => {
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
      expect(result.code).toContain('export function VoidJsPage(props)')
    })
  })
})
