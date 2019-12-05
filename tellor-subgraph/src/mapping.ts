import {
  DisputeVoteTallied,
  NewDispute,
  NewStake,
  StakeWithdrawn,
  StakeWithdrawRequested,
  Transfer as TransferEvent,
} from '../generated/Tellor/Tellor'
import { Block, Miner, Transaction, Transfer } from '../generated/schema'
import { createBlock, createTransaction, createId } from './utils'

export function handleNewStake(event: NewStake): void {
  let block = createBlock(event.block)
  let transaction = createTransaction(event.transaction, event.block)

  let id = event.params._sender.toHex()
  let miner = new Miner(id)
  miner.transaction = transaction.id
  miner.status = 'STAKED'

  if (Block.load(block.id) == null) {
    block.save()
  }
  transaction.save()
  miner.save()
}

export function handleStakeWithdrawn(event: StakeWithdrawn): void {
  let block = createBlock(event.block)
  let transaction = createTransaction(event.transaction, event.block)

  let id = event.params._sender.toHex()
  let miner = Miner.load(id)
  if (miner != null) {
    miner.transaction = transaction.id
    miner.status = 'NOT_STAKED'
    if (Block.load(block.id) == null) {
      block.save()
    }
    transaction.save()
    miner.save()
  }
}

export function handleStakeWithdrawRequested(event: StakeWithdrawRequested): void {
  let block = createBlock(event.block)
  let transaction = createTransaction(event.transaction, event.block)

  let id = event.params._sender.toHex()
  let miner = Miner.load(id)
  if (miner != null) {
    miner.transaction = transaction.id
    miner.status = 'LOCKED_FOR_WITHDRAW'
    if (Block.load(block.id) == null) {
      block.save()
    }
    transaction.save()
    miner.save()
  }
}

export function handleNewDispute(event: NewDispute): void {
  let block = createBlock(event.block)
  let transaction = createTransaction(event.transaction, event.block)

  let id = event.params._miner.toHex()
  let miner = Miner.load(id)
  // TODO: should never be the case
  if (miner != null) {
    miner.transaction = transaction.id
    miner.status = 'ON_DISPUTE'
    if (Block.load(block.id) == null) {
      block.save()
    }
    transaction.save()
    miner.save()
  }
}

export function handleDisputeVoteTallied(event: DisputeVoteTallied): void {
  let block = createBlock(event.block)
  let transaction = createTransaction(event.transaction, event.block)

  let id = event.params._reportedMiner.toHex()
  let miner = Miner.load(id)
  // TODO: should never be the case
  if (miner != null) {
    miner.transaction = transaction.id
    if (event.params._active) {
      miner.status = 'NOT_STAKED'
    } else {
      miner.status = 'STAKED'
    }
    if (Block.load(block.id) == null) {
      block.save()
    }
    transaction.save()
    miner.save()
  }
}

// this one is to keep track of transfers
export function handleTransfer(event: TransferEvent): void {
  let block = createBlock(event.block)
  let transaction = createTransaction(event.transaction, event.block)

  let id = createId(event.transaction.hash, event.logIndex)
  let transfer = new Transfer(id)
  transfer.from = event.params._from
  transfer.to = event.params._to
  transfer.amount = event.params._value
  transfer.transaction = transaction.id.toString()

  if (Block.load(block.id) == null) {
    block.save()
  }
  transaction.save()
  transfer.save()
}
