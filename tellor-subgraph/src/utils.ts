import { BigInt, Bytes, EthereumBlock, EthereumTransaction } from '@graphprotocol/graph-ts'
import { Block, Miner, Transaction as TransactionEvent, Transfer, Transaction } from '../generated/schema'

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
