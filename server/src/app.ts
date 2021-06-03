import WebSocket from 'ws'
import { handleMessage } from './handleMessage'

const server = new WebSocket.Server({ port: 8081 })

export const runApp = (wss: WebSocket.Server): void => {
  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      handleMessage(wss, ws, data)
    })
  })
}

runApp(server)
