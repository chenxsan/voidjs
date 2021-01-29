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

export default function (babel: Babel): { visitor: Visitor<State> } {
  const template = babel.template
  // store the declaration name of default export
  let exportDefaultDeclarationName = ''
  return {
    visitor: {
      Program: {
        enter(path): void {
          if (!path.scope.hasBinding('createElement')) {
            path.unshiftContainer(
              'body',
              template.ast(`import { createElement } from 'react';`)
            )
          }

          if (!path.scope.hasBinding('ReactDOM')) {
            path.unshiftContainer(
              'body',
              template.ast(`import ReactDOM from "react-dom";`)
            )
          }
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
                    import("${app}").then(({default: App}) => {
                      ${h}(createElement(App, {Component: ${exportDefaultDeclarationName}, pageProps: data.props}), ${container});
                    });
                  } else {
                    ${h}(createElement(${exportDefaultDeclarationName}, data.props), ${container});
                  }
                })();
              } else {
                if (${!!app}) {
                  import("${app}").then(({default: App}) => {
                    ${h}(createElement(App, {Component: ${exportDefaultDeclarationName}, pageProps: {}}), ${container});
                  });
                } else {
                  ${h}(createElement(${exportDefaultDeclarationName}), ${container});
                }
              }`)
          )
        },
      },
      ExportDefaultDeclaration: {
        enter(path): void {
          // Only render function component
          if (path.node.declaration.type !== 'FunctionDeclaration')
            throw new Error('Only Function Component is supported')

          // Anonymous function
          if (!path.node.declaration.id)
            throw new Error('Anonymous Function Component is not supported')

          // save for next
          exportDefaultDeclarationName = path.node.declaration.id.name
        },
      },
    },
  }
}
