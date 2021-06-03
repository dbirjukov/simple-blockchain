import React from 'react'
import { Block } from '../types'
import './MinedBlocks.css'

export const MinedBlock: React.FC<Block> = ({
  hash,
  previousHash,
  transactions,
  nonce,
  timestamp,
}) => {
  return (
    <div className="p-1 mr-2 w-72 rounded-md shadow border-blue-400 bg-blue-100 whitespace-nowrap text-xs h-56 flex flex-col justify-between">
      <div className="p-1 rounded-sm overflow-x-auto overflow-y-hidden bg-blue-200">
        <span className="text-sm font-thin">Hash:</span>
        {hash}
      </div>

      <div className="p-1 rounded-sm bg-blue-200 p-1">
        <span className="text-sm font-thin">Transactions</span>
        <ul className="h-12 overflow-y-auto">
          {transactions.map((tr, i) => (
            <li key={i}>
              {tr.sender + ' --> ' + tr.receiver + ': ' + tr.amount}
            </li>
          ))}
        </ul>
      </div>
      <div className="p-1 rounded-sm bg-blue-200">
        <span className="text-sm font-thin">Nonce:</span> {nonce}
      </div>
      <div className="p-1 rounded-sm bg-blue-200">
        <span className="text-sm font-thin">Timestamp:</span>{' '}
        {new Date(timestamp).toLocaleString()}
      </div>
      <div className="p-1 rounded-sm bg-blue-200 overflow-x-auto overflow-y-hidden">
        <span className="text-sm font-thin">Prev hash:</span>
        {previousHash}
      </div>
    </div>
  )
}

const loader = (
  <div className="lds-ellipsis mx-auto">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
)

export interface MinedBlocksProps {
  blocks: Block[]
  loaderOn: boolean
}

const MinedBlocks: React.FC<MinedBlocksProps> = ({ blocks, loaderOn }) => {
  return (
    <section className="p-1 mt-8 mx-auto flex w-1/2 overflow-y-hidden">
      {loaderOn
        ? loader
        : blocks
            .slice()
            .reverse()
            .map((block) => <MinedBlock key={block.hash} {...block} />)}
    </section>
  )
}

export default MinedBlocks
