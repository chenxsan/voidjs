/**
 * htmlgaga - Manage your html templates & their static assets better for any server-side languages.
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
import * as React from 'react';
import ReactDOMServer = require('react-dom/server');
import prettier = require('prettier');
import * as path from 'path';
import HtmlWebpackPlugin = require('html-webpack-plugin');
import HtmlTags = require('html-webpack-plugin/lib/html-tags');
const { htmlTagObjectToString } = HtmlTags

function requireFromString(src: string, filename: string) {
  const Module = module.constructor;
  const m = new Module();
  m._compile(src, filename);
  return m.exports;
}

class SsrPlugin {
  constructor(options) {
    this.options = options;
  }
  apply(compiler): void {
    compiler.hooks.compilation.tap('SsrPlugin', compilation => {
      HtmlWebpackPlugin.getHooks(compilation).beforeAssetTagGeneration.tapAsync(
        'SsrPlugin',
        (htmlPluginData, next) => {
          this.assets = htmlPluginData.assets;
          next(null, htmlPluginData);
        }
      );
      HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
        'SsrPlugin',
        (htmlPluginData, next) => {
          // save for later use
          this.headTags = htmlPluginData.headTags;
          this.bodyTags = htmlPluginData.bodyTags;
          next(null, htmlPluginData);
        }
      );
    });
    compiler.hooks.emit.tapAsync('SsrPlugin', (compilation, next) => {
      const htmls = Object.keys(this.options.outputMapInput);

      for (let filename in compilation.assets) {
        // throw html htmlwebpackplugin created
        // we would rather create it ourself
        if (htmls.indexOf(filename) !== -1) {
          const entryJs = this.options.outputMapInput[filename];
          const Page = requireFromString(
            compilation.assets[entryJs].source(),
            entryJs
          ).default;
          const ssr = ReactDOMServer.renderToStaticMarkup(
            React.createElement(Page)
          );
          const hd = (this.headTags || [])
            .map(tag => htmlTagObjectToString(tag, true))
            .join('');
          const bd = (this.bodyTags || [])
            .filter(tag => {
              return !(
                (tag.tagName === 'script' && tag.attributes.src === 'index.js') // exclude entryJs from bodyTags
              );
            })
            .map(tag => htmlTagObjectToString(tag, true))
            .join('');
          // format html with prettier
          const body = prettier.format(
            `<!DOCTYPE html>
            <html lang="en">
              <head>
                ${hd}
                <title></title>
              </head>
              <body>
                ${ssr}
                ${bd}
              </body>
            </html>
            `,
            {
              parser: 'html'
            }
          );
          delete compilation.assets[filename];
          compilation.assets[filename.split(path.sep).join('-')] = {
            source: (): string => body,
            size: (): number => body.length
          };
          // remove entryJs
          delete compilation.assets[entryJs];
        }
      }

      next();
    });
  }
}
export default SsrPlugin;
