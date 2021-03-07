import type { Visitor } from '@babel/traverse'
import * as BabelTypes from '@babel/types'
import templateBuilder from '@babel/template'

interface PluginOptionsInterface {
  root?: string // root container to mount the app
  hydrate?: boolean // hydrate or render
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

export enum ComponentError {
  functionComponentOnly = 'Only Function Component is supported',
  namedFunctionComponentOnly = 'Anonymous Function Component is not supported',
  reservedFunctionName = 'Reserved Component Name',
}

export default function (babel: Babel): { visitor: Visitor<State> } {
  const template = babel.template
  // store the declaration name of default export
  let exportDefaultDeclarationName = ''

  const defaultVisitor: Visitor = {
    ExportDefaultDeclaration: {
      enter(path): void {
        if (path.node.declaration.type !== 'FunctionDeclaration') {
          if (path.node.declaration.type === 'Identifier') {
            if (path.scope.hasBinding(path.node.declaration.name)) {
              if (
                path.scope.getBinding(path.node.declaration.name)?.path.node
                  .type === 'FunctionDeclaration'
              ) {
                exportDefaultDeclarationName = path.node.declaration.name
              } else {
                // that Identifier is not defined as FunctionDeclaration
                // should throw
                throw new Error(ComponentError.functionComponentOnly)
              }
            } else {
              throw new Error(ComponentError.functionComponentOnly)
            }
          } else {
            throw new Error(ComponentError.functionComponentOnly)
          }
        }

        if (path.node.declaration.type === 'FunctionDeclaration') {
          if (!path.node.declaration.id)
            throw new Error(ComponentError.namedFunctionComponentOnly)

          if (path.node.declaration.id.name === voidjsApp)
            throw new Error(ComponentError.reservedFunctionName)

          exportDefaultDeclarationName = path.node.declaration.id.name
        }
      },
    },
  }
  return {
    visitor: {
      Program: {
        enter(path): void {
          if (!path.scope.hasBinding('createElement')) {
            path.unshiftContainer(
              'body',
              template.ast(`import { createElement } from "react";`)
            )
          }

          if (!path.scope.hasBinding('ReactDOM')) {
            path.unshiftContainer(
              'body',
              template.ast(`import ReactDOM from "react-dom";`)
            )
          }
          path.traverse(defaultVisitor)
        },
        exit(path, state): void {
          // no named default export found
          if (exportDefaultDeclarationName === '') return

          const {
            opts: { root = 'app', hydrate = false, app = false },
          } = state

          const h = `ReactDOM.${hydrate ? 'hydrate' : 'render'}`
          const container = `document.getElementById("${root}")`

          path.pushContainer(
            'body',
            template.ast(`if (typeof getStaticProps !== "undefined") {
                (async function () {
                  const data = await getStaticProps();
                  if (${!!app}) {
                    import("${app}").then(({default: ${voidjsApp}}) => {
                      ${h}(createElement(${voidjsApp}, {Component: ${exportDefaultDeclarationName}, pageProps: data.props}), ${container});
                    });
                  } else {
                    ${h}(createElement(${exportDefaultDeclarationName}, data.props), ${container});
                  }
                })();
              } else {
                if (${!!app}) {
                  import("${app}").then(({default: ${voidjsApp}}) => {
                    ${h}(createElement(${voidjsApp}, {Component: ${exportDefaultDeclarationName}, pageProps: {}}), ${container});
                  });
                } else {
                  ${h}(createElement(${exportDefaultDeclarationName}), ${container});
                }
              }`)
          )
        },
      },
    },
  }
}
