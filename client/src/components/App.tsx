import React, { useCallback, useEffect, useState } from 'react'
import InputTransaction from './InputTransaction'
import PendingTransactions from './PendingTransactions'
import MinedBlocks from './MinedBlocks'
import { Block, Transaction, MessageTypes, Message } from '../types'
import WebSocketController from '../lib/websocket-controller'
import BlockChainNode from '../lib/blockchain-node'

export const wsUrl = 'ws://localhost:8081'

const wsController = new WebSocketController(wsUrl)
const node = new BlockChainNode()

function App() {
  const [status, setStatus] = useState<string>('')
  const handleLongestChainRequest = (message: Message) => {
    const chain = node.chain
    wsController.respondWithLongestChain(message.uuid, chain)
  }

  const handleAnnounceTransactions = async (message: Message) => {
    const transactions = message.payload as Transaction[]
    try {
      const mining = node.mineNewBlockWith(transactions)
      setStatus(getStatus(node))
      const block = await mining
      wsController.announceBlock(block)
    } catch (error) {
      console.log(error)
    }
    setStatus(getStatus(node))
  }

  const handleAnnounceBlock = async (message: Message) => {
    const block = message.payload as Block
    setStatus('Adding a new block...')
    try {
      await node.addBlock(block)
    } catch (error) {
      console.log(error)
    }
    setStatus(getStatus(node))
  }

  const handleWsMessage = useCallback((message: Message) => {
    switch (message.type) {
      case MessageTypes.longestChainRequest:
        return handleLongestChainRequest(message)
      case MessageTypes.announceTransactions:
        return handleAnnounceTransactions(message)
      case MessageTypes.announceBlock:
        return handleAnnounceBlock(message)
      default:
        console.log(`Unknown message type: ${message.type}`)
    }
  }, [])

  useEffect(() => {
    async function initWebSocket() {
      await wsController.connect(handleWsMessage)
      const longestChain = await wsController.requestLongestChain()
      if (longestChain.length) {
        await node.initialize(longestChain)
      } else {
        await node.initialize([])
      }
      setStatus(getStatus(node))
    }
    initWebSocket()
    return () => wsController.disconnect()
  }, [handleWsMessage])

  const handleAddTransaction = (transaction: Transaction) => {
    node.addPendingTransaction(transaction)
    setStatus(getStatus(node))
  }

  const mineBlock = async () => {
    wsController.announceTransactions(node.pendingTransactions)
    await waitRandom(100) // give other nodes chance to mine the block first
    try {
      const mining: Promise<Block> = node.mineNewBlock()
      setStatus(getStatus(node))
      const block = await mining

      wsController.announceBlock(block)
    } catch (error) {
      console.log(error)
    } finally {
      node.clearPendingTransactions()
    }
    setStatus(getStatus(node))
  }

  return (
    <div className="container text-blue-900 flex flex-col items-center font-sans pb-6 mx-auto">
      <h1 className="py-5 my-5 text-5xl font-thin text-blue-900 w-100 self-stretch text-center rounded-xl">
        Blockchain App
      </h1>
      <h2>{status}</h2>
      <InputTransaction
        onAddTransaction={handleAddTransaction}
        disabled={node.isMining || node.isEmpty}
      />
      <PendingTransactions transactions={node.pendingTransactions} />
      <button
        onClick={mineBlock}
        disabled={node.isMining || node.isEmpty}
        className="text-white bg-blue-800 w-60 rounded-sm p-2 mt-3 uppercase tracking-widest hover:bg-indigo-700"
      >
        Mine Block
      </button>
      <MinedBlocks
        blocks={node.chain}
        loaderOn={node.isMining || node.isEmpty}
      />
    </div>
  )
}

export default App

function getStatus(node: BlockChainNode): string {
  if (!node.chain.length) {
    return 'Initializing with genesis block'
  } else if (node.isMining) {
    return 'Mining a new Block...'
  } else if (!node.pendingTransactions.length) {
    return 'Please add a transaction'
  } else {
    const count = node.pendingTransactions.length
    return `Ready to mine a block with ${count} transaction${
      count > 1 ? 's' : ''
    }`
  }
}

const waitRandom = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, Math.ceil(Math.random() * ms)))
