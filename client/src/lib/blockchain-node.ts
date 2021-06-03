import { Block, Transaction } from '../types'
import { getHash } from '../util'

let hashRequirement = '0000'
if (process.env.NODE_ENV === 'test') {
  hashRequirement = '00'
}

type NotMinedBlock = Omit<Block, 'hash' | 'nonce'>

export default class BlockChainNode {
  private _chain: Block[] = []
  private _pendingTransactions: Transaction[] = []
  private _isMining = false

  public async initialize(chain: Block[] = []) {
    if (chain.length) {
      this._chain = [...chain]
    } else {
      const genesisBlock = await this.createGenesisBlock()
      this._chain = [genesisBlock]
    }
  }

  private async mineBlock(block: NotMinedBlock): Promise<Block> {
    this._isMining = true
    let hash = ''
    let nonce = 0

    do {
      nonce++
      hash = await createHash(block, nonce)
    } while (!hash.startsWith(hashRequirement))
    this._isMining = false
    return {
      ...block,
      hash,
      nonce,
    }
  }

  public async mineNewBlock(): Promise<Block> {
    const block: NotMinedBlock = {
      timestamp: Date.now(),
      previousHash: this.lastBlockHash,
      transactions: this.pendingTransactions,
    }
    const minedBlock = await this.mineBlock(block)

    await this.addBlock(minedBlock)
    return minedBlock
  }

  public async mineNewBlockWith(transactions: Transaction[]): Promise<Block> {
    const block: NotMinedBlock = {
      timestamp: Date.now(),
      previousHash: this.lastBlockHash,
      transactions,
    }
    const minedBlock = await this.mineBlock(block)
    await this.addBlock(minedBlock)
    return minedBlock
  }

  async addBlock(block: Block) {
    // hash has to start with zeros
    if (!block.hash.startsWith(hashRequirement)) {
      throw new Error('Invalid hash')
    }
    // block with previous hash has to be the last one in the chain
    const lastBlockIndex = this.chain.findIndex(
      (b) => b.hash === block.previousHash,
    )
    if (lastBlockIndex !== this.chain.length - 1) {
      throw new Error(
        'Block with previous hash is not the last one in the chain',
      )
    }
    // the hash has to be correct

    const hash = await createHash(block, block.nonce)
    if (hash !== block.hash) {
      throw new Error('Incorrect hash')
    }
    this._chain.push(block)
  }

  get chain(): Block[] {
    return [...this._chain]
  }

  get isMining() {
    return this._isMining
  }

  private async createGenesisBlock() {
    const block: NotMinedBlock = {
      previousHash: 'GENESIS_BLOCK',
      timestamp: Date.now(),
      transactions: [],
    }
    return this.mineBlock(block)
  }

  get pendingTransactions() {
    return this._pendingTransactions
  }

  public addPendingTransaction(transaction: Transaction) {
    this._pendingTransactions.push(transaction)
  }

  public clearPendingTransactions(): void {
    this._pendingTransactions = []
  }
  private get lastBlockHash(): string {
    const chain = this.chain
    return chain[chain.length - 1].hash
  }

  get isEmpty(): boolean {
    return this._chain.length === 0
  }
}

async function createHash(
  block: NotMinedBlock,
  nonce: number,
): Promise<string> {
  const blockStringified =
    block.previousHash +
    block.timestamp +
    JSON.stringify(block.transactions) +
    nonce
  const hash = await getHash(blockStringified)
  return hash
}
