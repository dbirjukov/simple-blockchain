import React, { FormEvent, useState } from 'react'
import { Transaction } from '../types'

export interface IPropsInputTransaction {
  onAddTransaction(transaction: Transaction): void
  disabled: boolean
}

const inputDefaultValue = {
  sender: '',
  receiver: '',
  amount: 0,
}

type inputStateType = {
  sender: string
  receiver: string
  amount: number
}

const InputTransaction: React.FC<IPropsInputTransaction> = ({
  onAddTransaction,
  disabled,
}) => {
  const [inputState, setInputState] = useState<inputStateType>(
    inputDefaultValue,
  )

  const handleChangeInput: (e: React.ChangeEvent<HTMLInputElement>) => void = ({
    target,
  }) => {
    setInputState({ ...inputState, [target.name]: target.value })
  }

  const addTransaction = (e: FormEvent) => {
    e.preventDefault()
    onAddTransaction(inputState)
    setInputState({ ...inputDefaultValue })
  }

  const valid =
    inputState.sender.length > 0 &&
    inputState.receiver.length > 0 &&
    inputState.amount > 0
  return (
    <section className="border-indigo-900 shadow p-3 w-80">
      <form onSubmit={addTransaction} autoComplete="off">
        <div className="relative flex border-9">
          <label htmlFor="input-from" className="absolute text-xs opacity-80">
            From
          </label>
          <input
            type="text"
            id="input-from"
            data-testid="input-sender"
            name="sender"
            value={inputState.sender}
            onChange={handleChangeInput}
            className="w-full placeholder-opacity-20 placeholder-blue-900 border-b-2 border-blue-500 border-opacity-20 focus:border-opactiy-100 bg-opacity-10 text-center outline-none"
            placeholder="Linda"
          />
        </div>
        <div className="relative flex border-9">
          <label htmlFor="input-to" className="absolute text-xs opacity-80">
            To
          </label>
          <input
            type="text"
            id="input-to"
            name="receiver"
            data-testid="input-receiver"
            value={inputState.receiver}
            onChange={handleChangeInput}
            className="w-full placeholder-opacity-20 placeholder-blue-900 border-b-2 border-blue-500 border-opacity-20 focus:border-opactiy-100 bg-opacity-10 text-center outline-none"
            placeholder="Robert"
          />
        </div>
        <div className="relative flex border-9">
          <label htmlFor="input-amount" className="absolute text-xs opacity-80">
            Amount
          </label>
          <input
            type="number"
            step="1"
            id="input-amount"
            data-testid="input-amount"
            name="amount"
            value={inputState.amount}
            onChange={handleChangeInput}
            className="w-full placeholder-opacity-20 placeholder-blue-900 border-b-2 border-blue-500 border-opacity-20 focus:border-opactiy-100 bg-opacity-10 text-center outline-none"
            placeholder="199"
          />
        </div>
        <button
          type="submit"
          className="auto w-full mt-2 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-900 text-white font-thin uppercase text-sm p-1 hover:bg-blue-700"
          disabled={!valid || disabled}
        >
          Add transaction
        </button>
      </form>
    </section>
  )
}

export default InputTransaction
