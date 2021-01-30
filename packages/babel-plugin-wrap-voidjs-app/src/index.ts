import type { Visitor } from '@babel/traverse'
import * as BabelTypes from '@babel/types'
import templateBuilder from '@babel/template'
interface PluginOptionsInterface {
  app?: false | string // custom app available or not
}
interface State {
  opts: PluginOptionsInterface
}
interface Babel {
  types: typeof BabelTypes
  template: typeof templateBuilder
}
const voidjsApp = 'VOID_JS_APP'
const voidjsPage = 'VoidJsPage'

export enum ComponentError {
  functionComponentOnly = 'Only Function Component is supported',
  namedFunctionComponentOnly = 'Anonymous Function Component is not supported',
  reservedFunctionName = 'Reserved Component Name',
}

export default function (
  babel: Babel
): {
  visitor: Visitor<State>
} {
  const template = babel.template
  let exportDefaultDeclarationName = ''
  return {
    visitor: {
      Program: {
        enter(path, state): void {
          const {
            opts: { app = false },
          } = state
          if (!path.scope.hasBinding('createElement')) {
            path.unshiftContainer(
              'body',
              template.ast(`import { createElement } from "react";`)
            )
          }
          if (app) {
            path.unshiftContainer(
              'body',
              template.ast(`import ${voidjsApp} from "${app}";`)
            )
          }
        },
        exit(path, state): void {
          const {
            opts: { app = false },
          } = state
          if (app) {
            path.pushContainer(
              'body',
              template.ast(`
              export function ${voidjsPage}(props) {
                return createElement(${voidjsApp}, {Component: ${exportDefaultDeclarationName}, pageProps: props});
              }`)
            )
          }
        },
      },
      ExportDefaultDeclaration: {
        enter(path) {
          // Only render function component
          if (path.node.declaration.type !== 'FunctionDeclaration')
            throw new Error(ComponentError.functionComponentOnly)

          // Anonymous function
          if (!path.node.declaration.id)
            throw new Error(ComponentError.namedFunctionComponentOnly)

          if (path.node.declaration.id.name === voidjsPage)
            throw new Error(ComponentError.reservedFunctionName)

          // save for next
          exportDefaultDeclarationName = path.node.declaration.id.name
        },
      },
    },
  }
}
