/** global __resourceQuery */
declare const __resourceQuery: string
import { MessageType } from './MessageType'
import calculateDelay from './calculateDelay'

const socketUrl = `ws://${__resourceQuery.replace(/^\?/, '')}`

// let's try at most 10 times
const maxRetries = 10

// begin with 0
let retries = 0

const delay = 200

function createWebSocketClient(socketUrl: string): WebSocket {
  let client: WebSocket | null = new WebSocket(socketUrl)

  client.onopen = (): void => {
    if (retries > 0) {
      return window.location.reload()
    }
    console.log('Connected')
  }

  client.onmessage = function (event): void {
    const { type } = JSON.parse(event?.data)
    if (type === MessageType.RELOAD) {
      window.location.reload()
      return
    }
    if (type === MessageType.INVALID) {
      console.log('Rebuilding...')
      return
    }
  }

  client.onclose = (event): void => {
    console.log('Disconnected', event)
    // try to reconnect in case server restarted
    if (retries < maxRetries) {
      retries = retries + 1
      client = null
      // https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
      setTimeout(() => {
        createWebSocketClient(socketUrl)
      }, Math.random() * calculateDelay(delay, retries))
    } else {
      console.log(
        `Please make sure the server is on and refresh the page.`
      )
    }
  }

  return client
}

createWebSocketClient(socketUrl)
