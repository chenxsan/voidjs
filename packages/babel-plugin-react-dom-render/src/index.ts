import type { PluginObj } from '@babel/core'

interface State {
  opts: {
    root?: string
    hydrate?: boolean
  }
}
export default function (babel: any): PluginObj<State> {
  const template = babel.template
  let exportDefaultDeclarationName = ''
  return {
    visitor: {
      Program: {
        enter(path): void {
          if (path.scope.hasBinding('ReactDOM')) {
            // already there
            return
          }

          if (!path.scope.hasBinding('React')) {
            // if there's no React present,
            // why would u need ReactDOM
            return
          }

          path.unshiftContainer(
            'body',
            template.ast(`import ReactDOM from "react-dom";`)
          )
        },
        exit(path, state): void {
          if (!path.scope.hasBinding('React')) {
            // if there's no React present,
            return
          }
          if (exportDefaultDeclarationName === '') return
          const {
            opts: { root = 'app', hydrate = false },
          } = state
          path.pushContainer(
            'body',
            template.ast(`if (typeof getStaticProps !== "undefined") {
                (async function () {
                  const data = await getStaticProps();
                  ReactDOM.${
                    hydrate ? 'hydrate' : 'render'
                  }(React.createElement(${exportDefaultDeclarationName}, data.props), document.getElementById("${root}"));
                })();
              } else {
                ReactDOM.${
                  hydrate ? 'hydrate' : 'render'
                }(React.createElement(${exportDefaultDeclarationName}), document.getElementById("${root}"));
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
