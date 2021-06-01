export type UUID = string
export interface Transaction {
  sender: string
  receiver: string
  amount: number | null
}

export interface Block {
  hash: string
  previousHash: string
  transactions: Transaction[]
  nonce: number
  timestamp: number
}

export type Resolvable = {
  resolve: (value: Block[] | PromiseLike<Block[]>) => void
  reject: (reason: any) => void
}

export enum MessageTypes {
  longestChainRequest = 'LONGEST_CHAIN_REQUEST',
  longestChainResponse = 'LONGEST_CHAIN_RESPONSE',
  announceTransactions = 'ANNOUNCE_TRANSACTIONS',
  announceBlock = 'ANNOUNCE_BLOCK',
}

export interface Message {
  type: string
  uuid: UUID
  payload?: Block[] | Block | Transaction[]
}

export interface ResolvableMessage extends Omit<Message, 'payload'> {
  payload: Block[] | PromiseLike<Block[]>
}
