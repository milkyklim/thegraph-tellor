import {
  BeginDisputeCall,
  DisputeVoteTallied,
  NewDispute,
  NewStake,
  StakeWithdrawn,
  StakeWithdrawRequested,
  Transfer as TransferEvent,
} from '../generated/Tellor/Tellor'
import { Block, Miner, Transaction, Transfer, Slash } from '../generated/schema'
import { createBlock, createTransaction, createId, BIGINT_ZERO } from './utils'
import { ByteArray, crypto, Bytes, log, Address } from '@graphprotocol/graph-ts'

// DISPUTES
// NewTellorAddress
// NewDispute
// DisputeVoteTallied
// Voted

export function handleVoted(): void {
  // {
  //   "indexed": true,
  //   "internalType": "uint256",
  //   "name": "_disputeID",
  //   "type": "uint256"
  // },
  // {
  //   "indexed": false,
  //   "internalType": "bool",
  //   "name": "_position",
  //   "type": "bool"
  // },
  // {
  //   "indexed": true,
  //   "internalType": "address",
  //   "name": "_voter",
  //   "type
}

export function handleBeginDipsute(call: BeginDisputeCall): void {}

// MINERS

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

  // TODO: probably add logic to track new disputes here

  // IMP: there is a bug in smart contract that doesn't emit
  // events for fork proposals I skip this for now and wait
  // for the_fett to fix this problem

  let disputeId = event.params._disputeId
  let slash = new Slash(disputeId.toString())

  // slash.disputeId = disputeId
  // FIXME: fix
  // slash.hash = event.params._miner // hash as Bytes
  slash.finalized = false
  slash.winner = null
  // FIXME: fix
  slash.reporter = event.transaction.from.toHex()
  // FIXME: fix
  slash.suspect = miner.id
  // FIXME: update this one to the correct value
  slash.fee = BIGINT_ZERO
  // FIXME: update this one to the correct value
  slash.endDate = BIGINT_ZERO
  // FIXME: update this one to the correct value
  slash.blockNumber = BIGINT_ZERO
  // FIXME: update this one to the correct value
  // slash.votes = null
  slash.requestId = event.params._requestId
  slash.timestamp = event.params._timestamp
  // FIXME: update this one to the correct value
  slash.value = BIGINT_ZERO
  // FIXME: update this one to the correct value
  slash.minerSlot = BIGINT_ZERO

  slash.save()
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

  // TODO: probably add logic to track voting here
}

// TRANSFERS

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
