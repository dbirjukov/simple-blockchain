import React from 'react'
import { Transaction } from '../types'

export interface Props {
  transactions: Transaction[]
}

const PendingTransactions: React.FC<Props> = ({ transactions }) => {
  const displayTransactions = transactions.map((t, i) => (
    <p key={i}>
      {t.sender} ➡ {t.receiver}: {t.amount}
    </p>
  ))
  return (
    <section className="mt-4 border-blue-400 border p-2 md:w-2/3 sm:w-full lg:w-1/2 w-80 rounded-xl">
      <h2 className="text-center text-2xl text-blue-600 font-thin">
        Pending transactions
      </h2>
      <div
        style={{ minHeight: '100px' }}
        className="font-mono text-sm min-h-50 mt-2 text-center"
      >
        {displayTransactions}
      </div>
    </section>
  )
}

export default PendingTransactions
