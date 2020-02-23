module.exports = function(babel) {
  const { types: t } = babel
  return {
    visitor: {
      Program: {
        enter(path) {
          if (path.scope.hasBinding('ReactDOM')) {
            return
          }

          // import ReactDOM from 'react-dom'
          const identifier = t.identifier('ReactDOM')
          const importDefaultSpecifier = t.importDefaultSpecifier(identifier)
          const importDeclaration = t.importDeclaration(
            [importDefaultSpecifier],
            t.stringLiteral('react-dom')
          )
          path.unshiftContainer('body', importDeclaration)

          // ReactDOM.render(<Page />, document.getElementById('app'))
          path.pushContainer(
            'body',
            babel.parse(
              "ReactDOM.render(React.createElement(Page), document.getElementById('app'))"
            ).program.body[0]
          )
        }
      }
    }
  }
}
