import { runApp } from './app'
import WebSocket from 'ws'
import crypto from 'crypto'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const test_port = 8082
const test_url = 'ws://localhost:' + test_port

describe('LONGEST_CHAIN_REQUEST', () => {
  let wss: WebSocket.Server
  beforeEach(() => {
    if (wss) wss.close()
    wss = new WebSocket.Server({ port: test_port })
  })
  afterEach(() => wss.close())
  test('if there is just 1 node, sends an empty array', async () => {
    let response = ''
    runApp(wss)
    const ws = new WebSocket(test_url)
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'LONGEST_CHAIN_REQUEST', uuid: '123' }))
      ws.on('message', (data) => {
        response = data.toString()
      })
    })
    await wait(110)
    expect(response).toBe(
      JSON.stringify({
        type: 'LONGEST_CHAIN_RESPONSE',
        uuid: '123',
        payload: [],
      }),
    )
    ws.terminate()
    wss.close()
  })
  test('if more than 2 nodes connected, asks for a longest chain', async () => {
    const bcGen = new BlockChainGenerator()
    runApp(wss)
    const ws1 = new WebSocket(test_url)
    const ws2 = new WebSocket(test_url)
    const ws3 = new WebSocket(test_url)

    bcGen.addRandom(2)
    let blockChain: Block[] = []

    // ws1 has longest chain
    // test on ws2

    ws1.on('open', () => {
      ws1.on('message', (data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'LONGEST_CHAIN_REQUEST') {
          ws1.send(
            JSON.stringify({
              type: 'LONGEST_CHAIN_RESPONSE',
              uuid: message.uuid,
              payload: bcGen.chain,
            }),
          )
        }
      })
    })

    ws3.on('open', () => {
      const smallBlockChain = new BlockChainGenerator()
      smallBlockChain.addRandom(1)
      ws3.on('message', (data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'LONGEST_CHAIN_REQUEST') {
          ws3.send(
            JSON.stringify({
              type: 'LONGEST_CHAIN_RESPONSE',
              uuid: message.uuid,
              payload: smallBlockChain.chain,
            }),
          )
        }
      })
    })

    ws2.on('open', () => {
      ws2.send(JSON.stringify({ type: 'LONGEST_CHAIN_REQUEST', uuid: 123 }))
      ws2.on('message', (data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'LONGEST_CHAIN_RESPONSE') {
          blockChain = message.payload
        }
      })
    })
    await wait(100)
    expect(blockChain).toEqual(bcGen.chain)
    ws1.terminate()
    ws2.terminate()
    ws3.terminate()
  })
})

describe('ANNOUNCE_TRANSACTIONS', () => {
  let wss: WebSocket.Server
  beforeEach(() => {
    if (wss) wss.close()
    wss = new WebSocket.Server({ port: test_port })
  })
  afterEach(() => wss.close())
  test('broadcasts transaction to all nodes', async () => {
    runApp(wss)
    const wsBroadcasting = new WebSocket(test_url)
    const wsReceiving1 = new WebSocket(test_url)
    const wsReceiving2 = new WebSocket(test_url)

    const transactions = BlockChainGenerator.generateRandomTransactions()

    wsBroadcasting.on('open', () => {
      wsBroadcasting.send(
        JSON.stringify({
          type: 'ANNOUNCE_TRANSACTIONS',
          uuid: '12345',
          payload: transactions,
        }),
      )
    })
    const transactionsReceived: Array<Transaction[]> = []

    wsReceiving1.on('open', () => {
      wsReceiving1.on('message', (data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'ANNOUNCE_TRANSACTIONS') {
          transactionsReceived.push(message.payload)
        }
      })
    })
    wsReceiving2.on('open', () => {
      wsReceiving2.on('message', (data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'ANNOUNCE_TRANSACTIONS') {
          transactionsReceived.push(message.payload)
        }
      })
    })
    await wait(100)
    expect(transactionsReceived).toEqual([transactions, transactions])
  })
  test('if payload is empty, does nothing', async () => {
    runApp(wss)
    const wsBroadcasting = new WebSocket(test_url)
    const wsReceiving = new WebSocket(test_url)

    wsBroadcasting.on('open', () => {
      wsBroadcasting.send(
        JSON.stringify({
          type: 'ANNOUNCE_TRANSACTIONS',
          uuid: '12345',
          payload: [],
        }),
      )
    })
    const handleData = jest.fn()
    wsReceiving.on('open', () => {
      wsReceiving.on('message', handleData)
    })
    await wait(100)
    expect(handleData).not.toHaveBeenCalled()
  })
})

describe('ANNOUNCE_BLOCK', () => {
  let wss: WebSocket.Server
  beforeEach(() => {
    if (wss) wss.close()
    wss = new WebSocket.Server({ port: test_port })
  })
  test('checks validity of a block and if ok sends new block to all nodes', async () => {
    runApp(wss)
    const ws1 = new WebSocket(test_url)
    const ws2 = new WebSocket(test_url)
    const ws3 = new WebSocket(test_url)

    const bcGenerator = new BlockChainGenerator()
    const validBlock = await bcGenerator.mineBlock({
      previousHash: '',
      timestamp: Date.now(),
      transactions: BlockChainGenerator.generateRandomTransactions(),
    })

    let receivedBlocks: Block[] = []

    ws1.on('open', () => {
      ws1.send(
        JSON.stringify({
          type: 'ANNOUNCE_BLOCK',
          uuid: 123,
          payload: validBlock,
        }),
      )
    })
    ws2.on('open', () => {
      ws2.on('message', (data) => {
        const message = parseMsg(data)
        if (message.type === 'ANNOUNCE_BLOCK') {
          receivedBlocks.push(message.payload)
        }
      })
    })
    ws2.on('open', () => {
      ws2.on('message', (data) => {
        const message = parseMsg(data)
        if (message.type === 'ANNOUNCE_BLOCK') {
          receivedBlocks.push(message.payload)
        }
      })
    })
    await wait(100)
    expect(receivedBlocks).toEqual([validBlock, validBlock])
  })
})

interface Transaction {
  sender: string
  receiver: string
  amount: number
}

interface Block {
  hash: string
  previousHash: string
  transactions: Transaction[]
  timestamp: number
  nonce: number
}

type NotMinedBlock = Omit<Block, 'hash' | 'nonce'>

class BlockChainGenerator {
  chain: Block[]
  constructor() {
    this.chain = []
  }
  add(block: Block): void {
    this.chain.push(block)
  }
  addRandom(times = 1) {
    for (let i = 1; i <= times; i++) {
      const hash = crypto.createHash('sha256')
      const previousHash = crypto.createHash('sha256')
      hash.update(crypto.randomBytes(5).toString('hex'))
      previousHash.update(crypto.randomBytes(5).toString('hex'))
      const timestamp = Date.now()
      const transactions = BlockChainGenerator.generateRandomTransactions()
      const nonce = Math.ceil(Math.random() * 1000)
      this.chain.push({
        hash: hash.digest('hex'),
        previousHash: previousHash.digest('hex'),
        transactions,
        timestamp,
        nonce,
      })
    }
  }
  async mineBlock(block: NotMinedBlock): Promise<Block> {
    let data
    let nonce = 0
    let hash: string = ''

    do {
      data =
        JSON.stringify(block.transactions) +
        block.timestamp +
        block.previousHash +
        nonce
      hash = this.getHash(data)
      nonce++
    } while (!hash.startsWith('0000'))

    return { ...block, hash, nonce }
  }

  getHash(data: string): string {
    const hash = crypto.createHash('sha256')
    hash.update(data)
    return hash.digest('hex')
  }

  static generateRandomTransactions(): Transaction[] {
    let names = ['Kevin', 'Marta', 'Linda', 'Bob', 'Charlie', 'Ryan']
    function randomName(): string {
      return names[Math.floor(Math.random() * names.length)]
    }
    let transactions = []
    for (let i = 1; i <= Math.ceil(Math.random() * 3); i++) {
      const sender = randomName()
      let receiver: string
      do {
        receiver = randomName()
      } while (receiver === sender)
      const amount = Math.ceil(Math.random() * 1000)
      transactions.push({
        sender,
        receiver,
        amount,
      })
    }
    return transactions
  }
}

const parseMsg = (data: WebSocket.Data) => JSON.parse(data.toString())
