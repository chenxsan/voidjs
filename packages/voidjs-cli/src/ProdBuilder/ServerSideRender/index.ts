/**
 * Copyright 2020-present, Sam Chen.
 *
 * Licensed under GPL-3.0-or-later
 *
 * This file is part of voidjs.

    voidjs is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    voidjs is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with voidjs.  If not, see <https://www.gnu.org/licenses/>.
 */
import path from 'path'
import fs from 'fs-extra'
import prettier from 'prettier'

import render from './react'

import { VoidjsConfig } from '../../Builder/index'

import type { HelmetData } from 'react-helmet'

import { SyncHook } from 'tapable'
import hasClientEntry from '../../DevServer/hasClientEntry'
export default class Ssr {
  hooks: {
    // @ts-ignore
    [propName: string]: SyncHook
  }
  helmet?: HelmetData
  constructor() {
    this.hooks = {
      helmet: new SyncHook(),
    }
  }

  async run(
    pagesDir: string,
    templateName: string,
    outputPath: string,
    voidjsConfig: VoidjsConfig,
    css: string[]
  ): Promise<void> {
    function getRelativePath(css: string) {
      const from = path.join(outputPath, templateName, '..')
      const to = path.join(outputPath, css)
      return path.relative(from, to)
    }
    // insert css into <head></head>
    let preloadStyles = ''

    if (voidjsConfig.html.preload.style) {
      preloadStyles = css
        .map((css) => {
          return `<link rel="preload" href="${getRelativePath(
            css
          )}" as="style" />`
        })
        .join('')
    }

    // TODO maybe include it as <style />?
    const hd = css
      .map((css) => {
        return `<link rel="stylesheet" href="${getRelativePath(css)}" />`
      })
      .join('')

    const appPath = `${path.resolve(outputPath, templateName + '.js')}`
    const { default: App, getStaticProps } = await import(appPath)

    let props

    if (getStaticProps) {
      const staticProps = await getStaticProps()
      props = staticProps.props
    }

    const html = render(App, props)

    this.hooks.helmet.call()

    const hasClientJs = hasClientEntry(path.join(pagesDir, templateName))

    let body: string
    if (this.helmet) {
      if (hasClientJs.exists === true) {
        // add some placeholders for later replacement
        body = `<!DOCTYPE html><html ${this.helmet.htmlAttributes.toString()}><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" /><meta name="generator" content="voidjs" />${this.helmet.title.toString()}${this.helmet.meta.toString()}${this.helmet.link.toString()}${this.helmet.script.toString()}${preloadStyles}<!-- preloadVoidJsClientStyle -->${hd}<!-- loadVoidJsClientStyle --></head><body>${html}<!-- loadVoidJsClientJs --></body></html>`
      } else {
        body = `<!DOCTYPE html><html ${this.helmet.htmlAttributes.toString()}><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" /><meta name="generator" content="voidjs" />${this.helmet.title.toString()}${this.helmet.meta.toString()}${this.helmet.link.toString()}${this.helmet.script.toString()}${preloadStyles}${hd}</head><body>${html}</body></html>`
      }
    } else {
      if (hasClientJs.exists === true) {
        // add some placeholders for later replacement
        body = `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" /><meta name="generator" content="voidjs" />${preloadStyles}<!-- preloadVoidJsClientStyle -->${hd}<!-- loadVoidJsClientStyle --></head><body>${html}<!-- loadVoidJsClientJs --></body></html>`
      } else {
        body = `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" /><meta name="generator" content="voidjs" />${preloadStyles}${hd}</head><body>${html}</body></html>`
      }
    }

    if (hasClientJs.exists === false) {
      if (voidjsConfig?.html?.pretty === true) {
        body = prettier.format(body, {
          parser: 'html',
        })
      }
    }

    fs.outputFileSync(path.join(outputPath, templateName + '.html'), body)

    fs.removeSync(appPath)
  }
}
