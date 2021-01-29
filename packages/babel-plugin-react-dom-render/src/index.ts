import type { PluginObj } from '@babel/core'

interface State {
  opts: {
    root?: string
    hydrate?: boolean
    app?: boolean | string
  }
}
export default function (babel: any): PluginObj<State> {
  const template = babel.template
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
          if (exportDefaultDeclarationName === '') return
          const {
            opts: { root = 'app', hydrate = false, app = false },
          } = state
          path.pushContainer(
            'body',
            template.ast(`if (typeof getStaticProps !== "undefined") {
                (async function () {
                  const data = await getStaticProps();
                  if (${!!app}) {
                    import("${app}").then(({default: App}) => {
                      ReactDOM.${
                        hydrate ? 'hydrate' : 'render'
                      }(createElement(App, {Component: ${exportDefaultDeclarationName}, pageProps: data.props}), document.getElementById("${root}"));
                    });
                  } else {
                    ReactDOM.${
                      hydrate ? 'hydrate' : 'render'
                    }(createElement(${exportDefaultDeclarationName}, data.props), document.getElementById("${root}"));
                  }
                })();
              } else {
                if (${!!app}) {
                  import("${app}").then(({default: App}) => {
                    ReactDOM.${
                      hydrate ? 'hydrate' : 'render'
                    }(createElement(App, {Component: ${exportDefaultDeclarationName}, pageProps: {}}), document.getElementById("${root}"));
                  });
                } else {
                  ReactDOM.${
                    hydrate ? 'hydrate' : 'render'
                  }(createElement(${exportDefaultDeclarationName}), document.getElementById("${root}"));
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
            throw new Error('Anonymous Function Component not supported')

          // save for next
          exportDefaultDeclarationName = path.node.declaration.id.name
        },
      },
    },
  }
}
