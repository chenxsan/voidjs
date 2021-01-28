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

import stripAnsi from 'strip-ansi'
import { encode } from 'html-entities'

const overlay = document.createElement('div')

// FIXME styles from app might spill into overlay
// we might use iframe if needed
const overlayStyles = {
  position: 'fixed',
  top: '0',
  right: '0',
  bottom: '0',
  left: '0',
  background: 'white',
  zIndex: 999999,
  fontSize: '18px', // I hate small font size
  whiteSpace: 'pre',
  paddingLeft: '20px',
  paddingRight: '20px',
  overflow: 'auto',
  lineHeight: 1.5,
}

// set styles for overlay
Object.keys(overlayStyles).forEach((key) => {
  overlay.style[key] = overlayStyles[key]
})
function htmlElement(
  txt: string,
  tag = 'div',
  styles: {
    [propName: string]: number | string
  } = {}
): HTMLElement {
  const element = document.createElement(tag)
  element.innerHTML = txt

  // set styles
  Object.keys(styles).forEach((key) => {
    element.style[key] = styles[key]
  })
  return element
}
interface WebpackError {
  moduleName: string
  message: string
}
export default function report(errors: WebpackError[]): void {
  const { moduleName, message } = errors[0]
  overlay.appendChild(
    htmlElement(`ERROR in ${moduleName}`, 'h1', {
      color: 'red',
    })
  )
  overlay.appendChild(htmlElement(encode(stripAnsi(message)), 'pre'))
  document.body?.appendChild(overlay)
}
