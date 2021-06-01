import {
  Block,
  Message,
  UUID,
  Resolvable,
  MessageTypes,
  Transaction,
} from '../types'
import { uuidv4 } from '../util'

type ConnectFn = (message: Message) => void

export default class WebSocketController {
  private websocket!: Promise<WebSocket>
  private messagesCallback!: ConnectFn
  public readonly messagesAwaitingReply
  constructor(private url: string) {
    this.messagesAwaitingReply = new Map<UUID, Resolvable>()
  }

  async connect(messagesCallback: ConnectFn) {
    this.messagesCallback = messagesCallback
    this.websocket = new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url)
      ws.onopen = () => resolve(ws)
      ws.onerror = (err) => reject(err)
      ws.onmessage = (messageEvent) => this.onMessageReceived(messageEvent)
    })
  }
  disconnect() {
    this.websocket.then((ws) => ws.close())
  }
  requestLongestChain(): Promise<Block[]> {
    return new Promise((resolve, reject) => {
      const uuid = uuidv4()
      this.messagesAwaitingReply.set(uuid, { resolve, reject })
      this.send({
        type: MessageTypes.longestChainRequest,
        uuid,
      })
    })
  }

  async onMessageReceived(messageEvent: MessageEvent) {
    const message = JSON.parse(messageEvent.data)
    const uuid = message.uuid
    if (this.messagesAwaitingReply.has(uuid)) {
      const resolvable = this.messagesAwaitingReply.get(uuid)
      resolvable!.resolve(message.payload)
      this.messagesAwaitingReply.delete(uuid)
    } else {
      this.messagesCallback(message)
    }
  }

  private send(data: Message) {
    this.websocket.then((ws) => {
      ws.send(JSON.stringify(data))
    })
  }
  public respondWithLongestChain(uuid: UUID, chain: Block[]) {
    this.send({ type: MessageTypes.longestChainResponse, uuid, payload: chain })
  }

  public announceTransactions(transactions: Transaction[]) {
    const message: Message = {
      type: MessageTypes.announceTransactions,
      uuid: uuidv4(),
      payload: transactions,
    }
    this.send(message)
  }
  public announceBlock(block: Block) {
    const message: Message = {
      type: MessageTypes.announceBlock,
      uuid: uuidv4(),
      payload: block,
    }
    this.send(message)
  }
}
