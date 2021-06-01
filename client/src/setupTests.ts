// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder } from 'util'
import originalCrypto from 'crypto'

// global.crypto = crypto
global.TextEncoder = TextEncoder
const cryptoMock = {
  subtle: {
    async digest(algorithm: string, data: Uint8Array) {
      const algoLCase = algorithm.toLowerCase().replace('-', '')
      const hash = originalCrypto.createHash(algoLCase)
      return hash.update(data).digest()
    },
  },
}

//@ts-ignore
global.crypto = cryptoMock
