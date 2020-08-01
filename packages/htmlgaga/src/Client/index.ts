/**
 * Copyright 2020-present, Sam Chen.
 * 
 * Licensed under GPL-3.0-or-later
 * 
 * This file is part of htmlgaga.

    htmlgaga is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    htmlgaga is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with htmlgaga.  If not, see <https://www.gnu.org/licenses/>.
 */

/** global __WEBSOCKET__ */
// __WEBSOCKET__ is defined by webpack.DefinePlugin
declare const __WEBSOCKET__: string

import { MessageType } from './MessageType'
import calculateDelayMs from './calculateDelayMs'
import report from './overlay'

const prefix = `[htmlgaga]`

const socketUrl = `ws://${__WEBSOCKET__}`

// let's try at most 10 times
const maxRetries = 10

// begin with 0
let retries = 0

const delay = 200

let linkOpening = false

document.addEventListener('click', (e: MouseEvent) => {
  if ((e.target as HTMLElement)?.tagName.toLowerCase() === 'a') {
    linkOpening = true
  }
})

function createWebSocketClient(socketUrl: string): WebSocket {
  let client: WebSocket | null = new WebSocket(socketUrl)

  client.onopen = (): void => {
    if (retries > 0) {
      return window.location.reload()
    }
    console.log(`${prefix} Socket connected on ${socketUrl}`)
  }

  client.onmessage = function (event): void {
    const { type, data } = JSON.parse(event?.data)
    switch (true) {
      case type === MessageType.HASH:
        console.log(`${prefix} Built in ${data.endTime - data.startTime}ms`)
        return
      case type === MessageType.RELOAD:
        if (linkOpening) return // we should wait here
        window.location.reload()
        return
      case type === MessageType.INVALID:
        console.log(`${prefix} Rebuilding...`)
        return
      case type === MessageType.ERRORS:
        report(data)
        return
    }
  }

  client.onclose = (event): void => {
    console.log(`${prefix} Disconnected`, event)
    // try to reconnect in case server restarted
    if (retries < maxRetries) {
      retries = retries + 1
      client = null
      // https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
      setTimeout(() => {
        createWebSocketClient(socketUrl)
      }, Math.random() * calculateDelayMs(delay, retries))
    } else {
      console.log(
        `${prefix} Please make sure the server is on and refresh the page.`
      )
    }
  }

  return client
}

createWebSocketClient(socketUrl)
