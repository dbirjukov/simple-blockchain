import { fireEvent, render } from '@testing-library/react'
import InputTransaction, { IPropsInputTransaction } from './InputTransaction'

function getInitialProps(): IPropsInputTransaction {
  return {
    onAddTransaction: () => {},
    disabled: false,
  }
}

describe('inputTransaction', () => {
  test('root element is section with 1 child - form', () => {
    const props = getInitialProps()
    const { container, getByText } = render(<InputTransaction {...props} />)
    const section = container.querySelector('section') as HTMLElement
    expect(section).toBeInTheDocument()
    expect(section.querySelectorAll('input').length).toBe(3)
    //@ts-ignore
    expect(container.firstElementChild.firstElementChild.tagName).toBe('FORM')
    expect(getByText(/add transaction/i)).toBeInTheDocument()
  })

  test('on `ADD TRANSACTION` click should call handler from props with correct arguments', () => {
    const props = getInitialProps()
    props.onAddTransaction = jest.fn()
    props.disabled = false
    const { getByText, getByLabelText } = render(
      <InputTransaction {...props} />,
    )
    const addBtn = getByText(/add transaction/i)
    const senderInput = getByLabelText('From')
    const receiverInput = getByLabelText('To')
    const amountInput = getByLabelText('Amount')
    fireEvent.change(senderInput, { target: { value: 'Nicole' } })
    fireEvent.change(receiverInput, { target: { value: 'Jimmy' } })
    fireEvent.change(amountInput, { target: { value: '501' } })

    fireEvent.click(addBtn)
    expect(props.onAddTransaction).toHaveBeenCalled()
    jest.clearAllMocks()
  })
  test('button gets a `disabled` attr from props', () => {
    const props = getInitialProps()
    props.onAddTransaction = jest.fn()
    props.disabled = true
    const { getByText, getByLabelText } = render(
      <InputTransaction {...props} />,
    )
    const senderInput = getByLabelText('From')
    const receiverInput = getByLabelText('To')
    const amountInput = getByLabelText('Amount')
    fireEvent.change(senderInput, { target: { value: 'Nicole' } })
    fireEvent.change(receiverInput, { target: { value: 'Jimmy' } })
    fireEvent.change(amountInput, { target: { value: '501' } })

    const addBtn = getByText(/add transaction/i)
    fireEvent.click(addBtn)
    expect(props.onAddTransaction).not.toHaveBeenCalled()
    jest.clearAllMocks()
  })
  test('After add button is clicked, all input fields are cleared', () => {
    const props = getInitialProps()
    props.disabled = false
    const { getByText, getByLabelText } = render(
      <InputTransaction {...props} />,
    )
    const addBtn = getByText(/add transaction/i)
    const senderInput = getByLabelText('From')
    const receiverInput = getByLabelText('To')
    const amountInput = getByLabelText('Amount')
    fireEvent.change(senderInput, { target: { value: 'Nicole' } })
    fireEvent.change(receiverInput, { target: { value: 'Jimmy' } })
    fireEvent.change(amountInput, { target: { value: '501' } })
    fireEvent.click(addBtn)
    expect(senderInput).toHaveValue('')
    expect(receiverInput).toHaveValue('')
    expect(amountInput).toHaveValue(0)
  })
})
