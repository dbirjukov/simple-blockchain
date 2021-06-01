import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App, { wsUrl } from './App'
import { Server } from 'mock-socket'
import BlockchainNode from '../lib/blockchain-node'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface Message {
  type: string
  uuid?: string
  payload?: any
}

describe('App', () => {
  let mockServer: Server
  beforeEach(() => (mockServer = new Server(wsUrl)))
  afterEach(() => {
    mockServer.stop()
  })
  test('On app initialization sends request for longest chain', async () => {
    expect.assertions(1)
    let message: Message = {
      type: 'NO_CONNECTION_YET',
    }
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        message = JSON.parse(data as string)
      })
    })
    render(<App />)
    await wait(100)
    expect(message.type).toBe('LONGEST_CHAIN_REQUEST')
  })

  test('If response with longest chain is [], creates a genesis block', async () => {
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'LONGEST_CHAIN_REQUEST') {
          socket.send(
            JSON.stringify({
              type: 'LONGEST_CHAIN_RESPONSE',
              uuid: message.uuid,
              payload: [],
            }),
          )
        }
      })
    })
    render(<App />)
    await wait(100)
    const blocks = await screen.findAllByText('Hash:')
    expect(blocks.length).toBe(1)
    const prevHash = screen.getByText('Prev hash:') as HTMLElement
    expect(prevHash.parentElement!.textContent).toBe('Prev hash:GENESIS_BLOCK')
  })

  test('If response with longest chain is not empty, inserts blocks', async () => {
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'LONGEST_CHAIN_REQUEST') {
          socket.send(
            JSON.stringify({
              type: 'LONGEST_CHAIN_RESPONSE',
              uuid: message.uuid,
              payload: [
                {
                  hash: '111',
                  previousHash: '0111',
                  transactions: [
                    { sender: 'Kate', receiver: 'Sally', amount: 5 },
                  ],
                  nonce: 0,
                },
                {
                  hash: '222',
                  previousHash: '0222',
                  transactions: [
                    { sender: 'Kate', receiver: 'Sally', amount: 5 },
                  ],
                  nonce: 1,
                },
                {
                  hash: '333',
                  previousHash: '0333',
                  transactions: [
                    { sender: 'Kate', receiver: 'Sally', amount: 5 },
                  ],
                  nonce: 2,
                },
              ],
            }),
          )
        }
      })
    })
    render(<App />)
    await wait(100)
    const blocks = await screen.findAllByText('Hash:')
    expect(blocks.length).toBe(3)
    const prevHash = screen.getByText('0333') as HTMLElement
    expect(prevHash.textContent).toBe('Prev hash:0333')
    const nonce = screen.getByText('1')
    expect(nonce.textContent).toBe('Nonce: 1')
  })

  test('on longest chain request from server sends current blockchain', async () => {
    const testBlockChain = [
      {
        hash: '111',
        previousHash: '0111',
        transactions: [{ sender: 'Kate', receiver: 'Sally', amount: 5 }],
        nonce: 0,
      },
      {
        hash: '222',
        previousHash: '0222',
        transactions: [{ sender: 'Kate', receiver: 'Sally', amount: 5 }],
        nonce: 1,
      },
      {
        hash: '333',
        previousHash: '0333',
        transactions: [{ sender: 'Kate', receiver: 'Sally', amount: 5 }],
        nonce: 2,
      },
    ]
    let messageReceived
    mockServer.on('connection', (socket) => {
      socket.on('message', async (data) => {
        const message = JSON.parse(data.toString())
        if (message.type === 'LONGEST_CHAIN_REQUEST') {
          socket.send(
            JSON.stringify({
              type: 'LONGEST_CHAIN_RESPONSE',
              uuid: message.uuid,
              payload: testBlockChain,
            }),
          )
          await wait(30)
          socket.send(
            JSON.stringify({
              type: 'LONGEST_CHAIN_REQUEST',
              uuid: '1234',
            }),
          )
        } else if (message.type === 'LONGEST_CHAIN_RESPONSE') {
          messageReceived = message.payload
        }
      })
    })
    render(<App />)
    await wait(1000)
    expect(messageReceived).toEqual(testBlockChain)
  })
  test('Clicking add transaction adds a transaction to pending transactions list', async () => {
    render(<App />)
    const senderInput = screen.getByTestId('input-sender')
    const receiverInput = screen.getByTestId('input-receiver')
    const amountInput = screen.getByTestId('input-amount')
    const addBtn = screen.getByText(/add transaction/i)
    fireEvent.change(senderInput, { target: { value: 'Ken' } })
    fireEvent.change(receiverInput, { target: { value: 'Barbie' } })
    fireEvent.change(amountInput, { target: { value: 299 } })
    fireEvent.click(addBtn)
    const transaction = screen.getByText(/Ken . Barbie: 299/)
    expect(transaction).toBeInTheDocument()
  })
  test('Add transaction button is enabled only if all input fields are valid', async () => {
    render(<App />)
    const senderInput = screen.getByTestId('input-sender')
    const receiverInput = screen.getByTestId('input-receiver')
    const amountInput = screen.getByTestId('input-amount')
    expect(screen.getByText(/add transaction/i)).toBeDisabled()
    fireEvent.change(senderInput, { target: { value: 'Carl' } })
    expect(screen.getByText(/add transaction/i)).toBeDisabled()
    fireEvent.change(receiverInput, { target: { value: 'Mona' } })
    expect(screen.getByText(/add transaction/i)).toBeDisabled()
    fireEvent.change(amountInput, { target: { value: '101' } })
    expect(screen.getByText(/add transaction/i)).not.toBeDisabled()
  })

  test('clicking Mine Block button notifies server with pending transactions and starts mining', async () => {
    const serverReceivedMessages: string[] = []
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        const message = JSON.parse(data.toString()) as Message
        if (message.type === 'ANNOUNCE_TRANSACTIONS') {
          serverReceivedMessages.push(message.type)
        } else if (message.type === 'ANNOUNCE_BLOCK') {
          serverReceivedMessages.push(message.type)
        } else if (message.type === 'LONGEST_CHAIN_REQUEST') {
          socket.send(
            JSON.stringify({
              type: 'LONGEST_CHAIN_RESPONSE',
              uuid: message.uuid,
              payload: [
                {
                  hash: '000',
                  previousHash: '123',
                  transactions: [
                    {
                      sender: 'Kate',
                      receiver: 'Boris',
                      amount: 100,
                    },
                  ],
                  nonce: 0,
                  timestamp: Date.now(),
                },
              ],
            }),
          )
        }
      })
    })
    render(<App />)
    await screen.findByText(/prev hash/i)
    const senderInput = screen.getByTestId('input-sender')
    const receiverInput = screen.getByTestId('input-receiver')
    const amountInput = screen.getByTestId('input-amount')
    const addTransactionBtn = screen.getByText(/add transaction/i)
    const mineBlockBtn = screen.getByText(/mine block/i)
    fireEvent.change(senderInput, { target: { value: 'Carl' } })
    fireEvent.change(receiverInput, { target: { value: 'Mona' } })
    fireEvent.change(amountInput, { target: { value: '102' } })
    fireEvent.click(addTransactionBtn)
    fireEvent.click(mineBlockBtn)
    await waitFor(() =>
      expect(serverReceivedMessages).toEqual([
        'ANNOUNCE_TRANSACTIONS',
        'ANNOUNCE_BLOCK',
      ]),
    )
    await screen.findByText('Carl --> Mona: 102')
  })

  test('on "ANNOUNCE_TRANSACTIONS" message starts mining, then sends "ANNOUNCE_BLOCK"', async () => {
    const serverReceivedMessages: string[] = []
    let websocket: any = null
    mockServer.on('connection', (socket) => {
      websocket = socket
      socket.on('message', (data) => {
        const message = JSON.parse(data.toString()) as Message
        if (message.type === 'ANNOUNCE_TRANSACTIONS') {
          serverReceivedMessages.push(message.type)
        } else if (message.type === 'ANNOUNCE_BLOCK') {
          serverReceivedMessages.push(message.type)
        } else if (message.type === 'LONGEST_CHAIN_REQUEST') {
          socket.send(
            JSON.stringify({
              type: 'LONGEST_CHAIN_RESPONSE',
              uuid: message.uuid,
              payload: [
                {
                  hash: '000',
                  previousHash: '123',
                  transactions: [
                    {
                      sender: 'Kate',
                      receiver: 'Boris',
                      amount: 100,
                    },
                  ],
                  nonce: 0,
                  timestamp: Date.now(),
                },
              ],
            }),
          )
        }
      })
    })
    render(<App />)
    await screen.findByText('Kate --> Boris: 100')
    await wait(50)
    websocket.send(
      JSON.stringify({
        type: 'ANNOUNCE_TRANSACTIONS',
        uuid: 123,
        payload: [{ sender: 'Mike', receiver: 'Sally', amount: 321 }],
      }),
    )
    await waitFor(() =>
      expect(serverReceivedMessages).toEqual(['ANNOUNCE_BLOCK']),
    )
    expect(screen.getByText('Mike --> Sally: 321')).toBeInTheDocument()
  })
  test('when block is mined announces it and inserts into blockchain', async () => {
    const serverReceivedMessages: string[] = []
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        const message = JSON.parse(data.toString()) as Message
        if (message.type === 'ANNOUNCE_TRANSACTIONS') {
          serverReceivedMessages.push(message.type)
        } else if (message.type === 'ANNOUNCE_BLOCK') {
          serverReceivedMessages.push(message.type)
        } else if (message.type === 'LONGEST_CHAIN_REQUEST') {
          socket.send(
            JSON.stringify({
              type: 'LONGEST_CHAIN_RESPONSE',
              uuid: message.uuid,
              payload: [
                {
                  hash: '000',
                  previousHash: '123',
                  transactions: [
                    {
                      sender: 'Kate',
                      receiver: 'Boris',
                      amount: 100,
                    },
                  ],
                  nonce: 0,
                  timestamp: Date.now(),
                },
              ],
            }),
          )
        }
      })
    })
    render(<App />)
    await screen.findByText(/prev hash/i)
    const senderInput = screen.getByTestId('input-sender')
    const receiverInput = screen.getByTestId('input-receiver')
    const amountInput = screen.getByTestId('input-amount')
    const addTransactionBtn = screen.getByText(/add transaction/i)
    const mineBlockBtn = screen.getByText(/mine block/i)
    fireEvent.change(senderInput, { target: { value: 'Carl' } })
    fireEvent.change(receiverInput, { target: { value: 'Mona' } })
    fireEvent.change(amountInput, { target: { value: '101' } })
    fireEvent.click(addTransactionBtn)
    fireEvent.click(mineBlockBtn)
    await waitFor(() =>
      expect(serverReceivedMessages).toEqual([
        'ANNOUNCE_TRANSACTIONS',
        'ANNOUNCE_BLOCK',
      ]),
    )
    await screen.findByText('Carl --> Mona: 101')
  })
  test('On ANNOUNCE_BLOCK, inserts received block into blockchain', async () => {
    let websocket: WebSocket
    const initialBlock = {
      hash: '0001',
      previousHash: '123',
      transactions: [
        {
          sender: 'Kate',
          receiver: 'Boris',
          amount: 100,
        },
      ],
      nonce: 0,
      timestamp: Date.now(),
    }

    mockServer.on('connection', (socket) => {
      websocket = socket
      socket.on('message', (data) => {
        const message = JSON.parse(data.toString()) as Message
        if (message.type === 'LONGEST_CHAIN_REQUEST') {
          socket.send(
            JSON.stringify({
              type: 'LONGEST_CHAIN_RESPONSE',
              uuid: message.uuid,
              payload: [initialBlock],
            }),
          )
        }
      })
    })
    render(<App />)
    await screen.findByText(/prev hash/i)
    const node = new BlockchainNode()
    const testTransaction = {
      sender: 'test_user1',
      receiver: 'test_user2',
      amount: 321,
    }
    await node.initialize([initialBlock])
    const testBlock = await node.mineNewBlockWith([testTransaction])
    websocket!.send(
      JSON.stringify({
        type: 'ANNOUNCE_BLOCK',
        uuid: 123,
        payload: testBlock,
      }),
    )
    await screen.findByText('test_user1 --> test_user2: 321')
  })

  test('After block is mined, pending transactions list is empty', async () => {
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        const message = JSON.parse(data.toString()) as Message
        if (message.type === 'LONGEST_CHAIN_REQUEST') {
          socket.send(
            JSON.stringify({
              type: 'LONGEST_CHAIN_RESPONSE',
              uuid: message.uuid,
              payload: [
                {
                  hash: '000',
                  previousHash: '123',
                  transactions: [
                    {
                      sender: 'Kate',
                      receiver: 'Boris',
                      amount: 100,
                    },
                  ],
                  nonce: 0,
                  timestamp: Date.now(),
                },
              ],
            }),
          )
        }
      })
    })
    render(<App />)
    await screen.findByText(/prev hash/i)
    const senderInput = screen.getByTestId('input-sender')
    const receiverInput = screen.getByTestId('input-receiver')
    const amountInput = screen.getByTestId('input-amount')
    const addTransactionBtn = screen.getByText(/add transaction/i)
    const mineBlockBtn = screen.getByText(/mine block/i)
    fireEvent.change(senderInput, { target: { value: 'test_user1' } })
    fireEvent.change(receiverInput, { target: { value: 'test_user2' } })
    fireEvent.change(amountInput, { target: { value: '102' } })
    fireEvent.click(addTransactionBtn)
    const pendingTransaction = screen.getByText(/test_user1 ➡ test_user2: 102/)
    expect(pendingTransaction).toBeInTheDocument()
    fireEvent.click(mineBlockBtn)

    await screen.findByText('test_user1 --> test_user2: 102')
    expect(pendingTransaction).not.toBeInTheDocument()
  })
  // TODO: Make blocks appear in reverse order
})
