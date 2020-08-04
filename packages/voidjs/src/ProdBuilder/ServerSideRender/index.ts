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

import { HtmlTagObject } from 'html-webpack-plugin'
import HtmlTags from 'html-webpack-plugin/lib/html-tags'
import { SyncHook } from 'tapable'
import hasClientEntry from '../../DevServer/hasClientEntry'
const { htmlTagObjectToString } = HtmlTags
interface HtmlTags {
  headTags: HtmlTagObject[]
  bodyTags: HtmlTagObject[]
}
async function loadHtmlTags(root: string, filename: string): Promise<HtmlTags> {
  try {
    const { headTags, bodyTags } = await import(path.resolve(root, filename))
    return {
      headTags,
      bodyTags,
    }
  } catch (err) {
    return {
      headTags: [],
      bodyTags: [],
    }
  }
}

async function loadAllHtmlTags(
  root: string,
  files: string[]
): Promise<HtmlTags> {
  return Promise.all(
    files.map(async (file) => await loadHtmlTags(root, file))
  ).then((values) =>
    values.reduce(
      (acc, cur) => {
        acc['headTags'] = acc.headTags.concat(cur.headTags)
        acc['bodyTags'] = acc.bodyTags.concat(cur.bodyTags)
        return acc
      },
      { headTags: [], bodyTags: [] }
    )
  )
}

export default class Ssr {
  hooks: {
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
    cacheRoot: string,
    outputPath: string,
    voidjsConfig: VoidjsConfig
  ): Promise<void> {
    const htmlTags = await loadAllHtmlTags(cacheRoot, [`${templateName}.json`])

    let { headTags } = htmlTags
    let { bodyTags } = htmlTags

    if (voidjsConfig.globalScripts) {
      headTags = (voidjsConfig.globalScripts.map((script) => {
        const { global, ...others } = script[1]
        return {
          tagName: 'script',
          voidTag: false,
          attributes: {
            ...others,
          },
        }
      }) as HtmlTagObject[]).concat(headTags)
    }

    // only include page entrypoint, so no need
    bodyTags = []

    let preloadStyles = ''

    if (voidjsConfig.html.preload.style) {
      preloadStyles = headTags
        .filter((tag) => tag.tagName === 'link')
        .map((tag) => {
          return `<link rel="preload" href="${tag.attributes.href}" as="${
            tag.attributes.rel === 'stylesheet' ? 'style' : ''
          }" />`
        })
        .join('')
    }

    let preloadScripts = ''

    if (voidjsConfig.html.preload.script) {
      preloadScripts = bodyTags
        .filter((tag) => tag.tagName === 'script')
        .concat(headTags.filter((tag) => tag.tagName === 'script'))
        .map((tag) => {
          return `<link rel="preload" href="${tag.attributes.src}" as="script" />`
        })
        .join('')
    }

    const hd = headTags.map((tag) => htmlTagObjectToString(tag, true)).join('')

    const bd = bodyTags.map((tag) => htmlTagObjectToString(tag, true)).join('')

    const appPath = `${path.resolve(outputPath, templateName + '.js')}`
    const { default: App } = await import(appPath)

    const html = render(App)

    this.hooks.helmet.call()

    let body: string
    if (this.helmet) {
      body = `<!DOCTYPE html><html ${this.helmet.htmlAttributes.toString()}><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" /><meta name="generator" content="voidjs" />${this.helmet.title.toString()}${this.helmet.meta.toString()}${this.helmet.link.toString()}${preloadStyles}${preloadScripts}${hd}</head><body>${html}${bd}</body></html>`
    } else {
      body = `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" /><meta name="generator" content="voidjs" />${preloadStyles}${preloadScripts}${hd}</head><body>${html}${bd}</body></html>`
    }

    const hasClientJs = hasClientEntry(path.join(pagesDir, templateName))

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
