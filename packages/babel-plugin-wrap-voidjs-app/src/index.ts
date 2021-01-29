export default function (babel) {
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
              template.ast(`import { createElement } from 'react';`)
            )
          }
          if (app) {
            path.unshiftContainer(
              'body',
              template.ast(`import VoidJsApp from "${app}";`)
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
              export function VoidJsPage(props) {
                return createElement(VoidJsApp, {Component: ${exportDefaultDeclarationName}, pageProps: props});
              }`)
            )
          }
        },
      },
      ExportDefaultDeclaration: {
        enter(path) {
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
