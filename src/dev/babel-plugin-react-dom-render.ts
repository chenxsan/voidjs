/**
 * htmlgaga - Manage multiple non-SPA pages with webpack and React.js.
 * 
    Copyright (C) 2020-present  Sam Chen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
export default function(babel) {
  const { types: t } = babel;
  return {
    visitor: {
      Program: {
        enter(path) {
          if (path.scope.hasBinding('ReactDOM')) {
            return;
          }

          // import ReactDOM from 'react-dom' if not imported yet
          const identifier = t.identifier('ReactDOM');
          const importDefaultSpecifier = t.importDefaultSpecifier(identifier);
          const importDeclaration = t.importDeclaration(
            [importDefaultSpecifier],
            t.stringLiteral('react-dom')
          );
          path.unshiftContainer('body', importDeclaration);
        }
      },
      ExportDefaultDeclaration: {
        enter(path, { opts: { root = 'app', hydrate = false } }): void {
          // Only render function component
          if (path.node.declaration.type !== 'FunctionDeclaration') return;

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
          );
        }
      }
    }
  };
}
