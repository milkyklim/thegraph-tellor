import { BigInt, Bytes } from '@graphprotocol/graph-ts'

// make a number the specified number of digits
export function rightPad(str: String, size: i32): String {
  while (str.length < size) {
    str = str + '0'
  }
  return str
}

// make a derived ID from tx and logIndex
export function createId(tx: Bytes, logIndex: BigInt): String {
  return rightPad(logIndex.toHex(), 40) + '-' + tx.toHex()
}
