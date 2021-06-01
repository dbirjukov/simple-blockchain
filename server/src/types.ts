export type UUID = string

export type Message = {
  type: string
  uuid: UUID
  payload: any
}

export interface Transaction {
  sender: string
  receiver: string
  amount: number
}
export interface Block {
  hash: string
  previousHash: string
  transactions: Transaction[]
  timestamp: number
  nonce: number
}

export type Responses = Array<Block[]>
