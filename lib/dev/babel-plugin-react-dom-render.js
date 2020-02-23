module.exports = function(babel) {
  const { types: t } = babel
  return {
    visitor: {
      Program: {
        enter(path) {
          if (path.scope.hasBinding('ReactDOM')) {
            return
          }

          // import ReactDOM from 'react-dom' if not imported yet
          const identifier = t.identifier('ReactDOM')
          const importDefaultSpecifier = t.importDefaultSpecifier(identifier)
          const importDeclaration = t.importDeclaration(
            [importDefaultSpecifier],
            t.stringLiteral('react-dom')
          )
          path.unshiftContainer('body', importDeclaration)
        }
      },
      ExportDefaultDeclaration: {
        enter(path, { opts: { root = 'app', hydrate = false } }) {
          // Only render function component
          if (path.node.declaration.type !== 'FunctionDeclaration') return

          // ReactDOM.render(<DefaultExport />, document.getElementById('rootElementId'))
          // ReactDOM.hydrate
          path.insertAfter(
            t.CallExpression(
              t.memberExpression(
                t.identifier('ReactDOM'),
                t.identifier(hydrate === true ? 'hydrate' : 'render')
              ),
              [
                t.CallExpression(
                  t.memberExpression(
                    t.identifier('React'),
                    t.identifier('createElement')
                  ),
                  [t.identifier(path.node.declaration.id.name)]
                ),
                t.CallExpression(
                  t.memberExpression(
                    t.identifier('document'),
                    t.identifier('getElementById')
                  ),
                  [t.stringLiteral(root)]
                )
              ]
            )
          )
        }
      }
    }
  }
}
