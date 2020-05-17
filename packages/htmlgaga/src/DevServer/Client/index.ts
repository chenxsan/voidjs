/** global __resourceQuery */
declare const __resourceQuery: string
import { MessageType } from './MessageType'

const socketUrl = `ws://${__resourceQuery.replace(/^\?/, '')}`

const client = new WebSocket(socketUrl)

client.onopen = (): void => {
  console.log('Connected')

  client.send('ping')
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
  // TODO try to reconnect in case server restarted
}
