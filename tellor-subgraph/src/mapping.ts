import {
  BeginDisputeCall,
  DisputeVoteTallied,
  NewDispute,
  NewStake,
  StakeWithdrawn,
  StakeWithdrawRequested,
  Transfer as TransferEvent,
  Tellor,
} from '../generated/Tellor/Tellor'
import { Block, Miner, Transaction, Transfer, Slash } from '../generated/schema'
import { createBlock, createTransaction, createId, BIGINT_ZERO, stringToUTF8 } from './utils'
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
  // bind to contract to read the state
  let contract = Tellor.bind(event.address)

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

  slash.finalized = false
  slash.reporter = event.transaction.from.toHex()
  slash.suspect = id
  slash.requestId = event.params._requestId
  slash.timestamp = event.params._timestamp
  // restore values from storage
  slash.fee = contract.getDisputeUintVars(disputeId, crypto.keccak256(stringToUTF8('fee')) as Bytes)
  slash.endDate = contract.getDisputeUintVars(disputeId, crypto.keccak256(stringToUTF8('minExecutionDate')) as Bytes)
  slash.blockNumber = contract.getDisputeUintVars(disputeId, crypto.keccak256(stringToUTF8('blockNumber')) as Bytes)
  slash.value = contract.getDisputeUintVars(disputeId, crypto.keccak256(stringToUTF8('value')) as Bytes)
  slash.minerSlot = contract.getDisputeUintVars(disputeId, crypto.keccak256(stringToUTF8('minerSlot')) as Bytes)
  // not decided yet
  slash.winner = null

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
