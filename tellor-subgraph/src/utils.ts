import { BigInt, Bytes, EthereumBlock, EthereumTransaction } from '@graphprotocol/graph-ts'
import { Block, Miner, Transaction as TransactionEvent, Transfer, Transaction } from '../generated/schema'
import { ByteArray } from '@graphprotocol/graph-ts'

// make a number the specified number of digits
export function rightPad(str: String, size: i32): String {
  while (str.length < size) {
    str = str + '0'
  }
  return str
}

export let BIGINT_ONE = BigInt.fromI32(1)
export let BIGINT_ZERO = BigInt.fromI32(0)

// make a derived ID from tx and logIndex
export function createId(tx: Bytes, logIndex: BigInt): String {
  return rightPad(logIndex.toHex(), 40) + '-' + tx.toHex()
}

export function createTransaction(ethereumTransaction: EthereumTransaction, ethereumBlock: EthereumBlock): Transaction {
  let transaction = new Transaction(ethereumTransaction.hash.toHex())
  transaction.block = ethereumBlock.hash.toHex()
  return transaction
}

export function createBlock(ethereumBlock: EthereumBlock): Block {
  let block = new Block(ethereumBlock.hash.toHex())
  block.timestamp = ethereumBlock.timestamp
  block.number = ethereumBlock.number
  return block
}

export function stringToUTF8(string: String): ByteArray {
  // AssemblyScript counts a null terminator, we don't want that.
  let len = string.lengthUTF8 - 1
  let utf8 = string.toUTF8()
  let bytes = new ByteArray(len)
  for (let i: i32 = 0; i < len; i++) {
    bytes[i] = load<u8>(utf8 + i)
  }
  return bytes
}
