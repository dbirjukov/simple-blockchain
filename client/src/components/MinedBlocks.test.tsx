import { render } from '@testing-library/react'
import MinedBlocks, { Block } from './MinedBlocks'

describe('MinedBlocks', () => {
  test('markup is correct', () => {
    const blocks = getBlocks(3)
    const { container } = render(<MinedBlocks blocks={blocks} />)
    const section = container.firstElementChild as HTMLElement
    expect(section.tagName).toBe('SECTION')
    expect(section.children.length).toBe(3)
  })
  test('props are passed correctly', () => {
    const blocks = getBlocks(2)
    const { getAllByText, getByText, debug, container } = render(
      <MinedBlocks blocks={blocks} />,
    )
    const hashes = getAllByText(/test hash/)
    expect(hashes.length).toBe(2)
    const searchTransaction =
      blocks[0].transactions[1].sender +
      ' --> ' +
      blocks[0].transactions[1].receiver +
      ': ' +
      blocks[0].transactions[1].amount

    const transaction = getByText(searchTransaction)
    expect(transaction).toBeInTheDocument()
    const nonce = getByText(blocks[1].nonce)
    expect(nonce).toBeInTheDocument()
    const prevHash = getByText(blocks[0].previousHash)
    expect(prevHash).toBeInTheDocument()
    const timeStamp = getByText(new Date(blocks[1].timestamp).toLocaleString())
    expect(timeStamp).toBeInTheDocument()
  })
})

function getBlocks(numberOfBlocks: number = 3): Block[] {
  const blocks = [
    {
      hash: 'test hash 1',
      previousHash: 'test previous hash 1',
      transactions: [
        {
          sender: 'Bob',
          receiver: 'Kevin',
          amount: 199,
        },
        {
          sender: 'Layla',
          receiver: 'Camila',
          amount: 123,
        },
        {
          sender: 'Martin',
          receiver: 'Chris',
          amount: 999,
        },
      ],
      nonce: 12312,
      timestamp: Date.now(),
    },
    {
      hash: 'test hash 2',
      previousHash: 'test previous hash 2',
      transactions: [
        {
          sender: 'Rick',
          receiver: 'Calvin',
          amount: 199,
        },
        {
          sender: 'Kevin',
          receiver: 'Andres',
          amount: 432,
        },
      ],
      nonce: 98312,
      timestamp: Date.now() + 10e5,
    },
    {
      hash: 'test hash 3',
      previousHash: 'test previous hash 3',
      transactions: [
        {
          sender: 'Riley',
          receiver: 'Milena',
          amount: 3,
        },
        {
          sender: 'Anastasia',
          receiver: 'Nick',
          amount: 17,
        },
      ],
      nonce: 44499,
      timestamp: Date.now() - 10e5,
    },
  ]
  return blocks.slice(0, numberOfBlocks)
}
