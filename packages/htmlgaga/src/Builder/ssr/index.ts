import path from 'path'
import fs from 'fs-extra'

import prettier from 'prettier'

import render from './react'

import { HtmlgagaConfig } from '../index'

import { HtmlTagObject } from 'html-webpack-plugin'
import HtmlTags from 'html-webpack-plugin/lib/html-tags'
const { htmlTagObjectToString } = HtmlTags
interface HtmlTags {
  headTags: HtmlTagObject[]
  bodyTags: HtmlTagObject[]
}
async function loadHtmlTags(root: string, filename: string): Promise<HtmlTags> {
  const { headTags, bodyTags } = await import(path.resolve(root, filename))
  return {
    headTags,
    bodyTags,
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

export default async function ssr(
  templateName: string,
  cacheRoot: string,
  outputPath: string,
  htmlgagaConfig: HtmlgagaConfig
): Promise<void> {
  const htmlTags = await loadAllHtmlTags(cacheRoot, [
    `${templateName}.json`,
    'client.json',
  ])

  const { headTags } = htmlTags
  let { bodyTags } = htmlTags

  bodyTags = bodyTags.filter((tag) => {
    return !(
      (tag.tagName === 'script' && templateName + '.js' === tag.attributes.src) // exclude entryJs from bodyTags
    )
  })
  let preloadStyles = ''

  if (htmlgagaConfig.html.preload.style) {
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

  if (htmlgagaConfig.html.preload.script) {
    preloadScripts = bodyTags
      .filter((tag) => tag.tagName === 'script')
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

  let body = `<!DOCTYPE html><html lang="${htmlgagaConfig.html.lang}"><head><title></title>${preloadStyles}${preloadScripts}${hd}</head><body>${html}${bd}</body></html>
        `

  if (htmlgagaConfig.html.pretty) {
    body = prettier.format(body, {
      parser: 'html',
    })
  }

  fs.outputFileSync(path.join(outputPath, templateName + '.html'), body)

  fs.removeSync(appPath)
}
