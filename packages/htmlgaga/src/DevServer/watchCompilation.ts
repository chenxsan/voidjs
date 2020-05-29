import { MessageType } from '../Client/MessageType'
import webpack from 'webpack'
import WebSocket from 'ws'

export default function watchCompilation(
  compiler: webpack.Compiler,
  wsServer: WebSocket.Server
): void {
  // make sure wsServer is ready
  if (!wsServer) return
  const reloadPluginName = 'htmlgaga-reload'

  compiler.hooks.done.tap(reloadPluginName, (stats) => {
    const statsJson = stats.toJson({
      all: false,
      hash: true,
      assets: true,
      warnings: true,
      errors: true,
      errorDetails: false,
    })
    const hasErrors = stats.hasErrors()
    const hasWarnings = stats.hasWarnings()
    wsServer.clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return
      client.send(
        JSON.stringify({
          type: MessageType.HASH,
          data: {
            hash: statsJson.hash,
            startTime: stats.startTime,
            endTime: stats.endTime,
          },
        })
      )
      if (hasErrors) {
        console.log(statsJson.errors)
        return client.send(
          JSON.stringify({
            type: MessageType.ERRORS,
            data: statsJson.errors,
          })
        )
      }
      if (hasWarnings) {
        return client.send(
          JSON.stringify({
            type: MessageType.WARNINGS,
            data: statsJson.warnings,
          })
        )
      }
      client.send(
        JSON.stringify({
          type: MessageType.RELOAD,
        })
      )
    })
  })

  compiler.hooks.invalid.tap(reloadPluginName, () => {
    wsServer.clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return
      client.send(
        JSON.stringify({
          type: MessageType.INVALID,
        })
      )
    })
  })
}
