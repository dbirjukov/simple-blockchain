import { render } from '@testing-library/react'
import PendingTransactions from './PendingTransactions'
import { Transaction } from './InputTransaction'

describe('PendingTransactions', () => {
  test('renders markup correctly', () => {
    const { container } = render(<PendingTransactions transactions={[]} />)
    expect(container.querySelectorAll('section')).toHaveLength(1)
    const h2 = container.querySelector('h2') as HTMLElement
    expect(h2.textContent).toBe('Pending transactions')
    expect(container.querySelectorAll('div')).toHaveLength(1)
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })
  test('passes and assigns props correctly', () => {
    const transactions: Transaction[] = [
      { sender: 'Mary', receiver: 'Kelly', amount: 99 },
      { sender: 'Joe', receiver: 'Frank', amount: 1 },
    ]
    const { getByText } = render(
      <PendingTransactions transactions={transactions} />,
    )
    expect(getByText('Mary ➡ Kelly: 99')).toBeInTheDocument()
    expect(getByText('Joe ➡ Frank: 1')).toBeInTheDocument()
  })
})
