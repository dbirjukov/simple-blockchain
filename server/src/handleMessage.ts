import WebSocket from 'ws'
import { Message, Block, UUID, Responses } from './types'

export const responsesFromClients: Map<UUID, Responses> = new Map()
export const requestSockets: Map<UUID, WebSocket> = new Map()

export function handleMessage(
  wss: WebSocket.Server,
  ws: WebSocket,
  data: WebSocket.Data,
): void {
  const message = JSON.parse(data.toString())
  console.log(`
    received message - ${message.type}
    number of clients - ${wss.clients.size} 
  `)
  switch (message.type) {
    case 'LONGEST_CHAIN_REQUEST':
      return handleLongestChainRequest(wss, ws, message.uuid)
    case 'LONGEST_CHAIN_RESPONSE':
      return handleLongestChainResponse(wss, ws, message)
    case 'ANNOUNCE_TRANSACTIONS':
      return handleAnnounceTransactions(wss, ws, message)
    case 'ANNOUNCE_BLOCK':
      return handleAnnounceBlock(wss, ws, message)
    default:
      return
  }
}

function handleLongestChainRequest(
  wss: WebSocket.Server,
  ws: WebSocket,
  uuid: string,
): void {
  if (wss.clients.size === 1) {
    return ws.send(
      JSON.stringify({
        type: 'LONGEST_CHAIN_RESPONSE',
        uuid,
        payload: [],
      }),
    )
  }
  responsesFromClients.set(uuid, [])

  requestSockets.set(uuid, ws)
  wss.clients.forEach((client) => {
    if (client !== ws) {
      client.send(JSON.stringify({ type: 'LONGEST_CHAIN_REQUEST', uuid }))
    }
  })
}

function handleLongestChainResponse(
  wss: WebSocket.Server,
  ws: WebSocket,
  message: Message,
): void {
  const { uuid, payload } = message
  const responses = responsesFromClients.get(uuid)
  if (!responses) return
  console.log(message)
  responses.push(message.payload)
  if (responses.length === wss.clients.size - 1) {
    const longestChain = getLongestChain(responses)
    console.log('longest chain', longestChain)
    responsesFromClients.delete(uuid)
    const response: Message = {
      type: 'LONGEST_CHAIN_RESPONSE',
      uuid: uuid,
      payload: longestChain,
    }
    const socket = requestSockets.get(uuid)
    if (!socket) return
    socket.send(JSON.stringify(response))
    requestSockets.delete(uuid)
  }
}

function handleAnnounceTransactions(
  wss: WebSocket.Server,
  ws: WebSocket,
  message: Message,
): void {
  if (!message.payload.length) return
  wss.clients.forEach((client) => {
    if (client !== ws) {
      client.send(
        JSON.stringify({
          type: 'ANNOUNCE_TRANSACTIONS',
          uuid: message.uuid,
          payload: message.payload,
        }),
      )
    }
  })
}

function handleAnnounceBlock(
  wss: WebSocket.Server,
  ws: WebSocket,
  message: Message,
): void {
  return wss.clients.forEach((client) => {
    if (client !== ws) {
      client.send(
        JSON.stringify({
          type: 'ANNOUNCE_BLOCK',
          uuid: message.uuid,
          payload: message.payload,
        }),
      )
    }
  })
}

function getLongestChain(blockchains: Array<Block[]>): Block[] {
  return blockchains.reduce(
    (longest, current) => (longest.length > current.length ? longest : current),
    [],
  )
}
