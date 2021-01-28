import http from 'http'
import WebSocket from 'ws'
export default function createWebSocketServer(
  httpServer: http.Server,
  socketPath: string
): WebSocket.Server {
  const wsServer = new WebSocket.Server({
    server: httpServer,
    path: socketPath,
  })

  wsServer.on('connection', (socket) => {
    socket.on('message', (data) => {
      // received data from client
      // TODO we might sync browsers in future
      console.log(`${data} from client`)
    })
  })

  wsServer.on('close', () => {
    console.log('websocket server closed')
  })

  function cleanup(): void {
    wsServer.close(() => {
      process.exit(1)
    })
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  return wsServer
}
