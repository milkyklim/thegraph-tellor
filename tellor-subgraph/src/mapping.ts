import {
  BeginDisputeCall,
  DisputeVoteTallied,
  NewDispute,
  NewStake,
  ProposeForkCall,
  StakeWithdrawn,
  StakeWithdrawRequested,
  Transfer as TransferEvent,
  Tellor,
  Voted,
} from '../generated/Tellor/Tellor'
import { Block, Miner, Fork, Transaction, Transfer, Slash, ForkVote, SlashVote } from '../generated/schema'
import { createBlock, createTransaction, createId, BIGINT_ZERO, stringToUTF8, BIGINT_ONE } from './utils'
import { ByteArray, crypto, Bytes, log, Address, BigInt } from '@graphprotocol/graph-ts'

// DISPUTES
// NewDispute
// DisputeVoteTallied
// Voted

export function handleVoted(event: Voted): void {
  // bind to contract to read the state
  let contract = Tellor.bind(event.address)

  let block = createBlock(event.block)
  let transaction = createTransaction(event.transaction, event.block)

  let disputeId = event.params._disputeID
  let id = disputeId.toString() + '-' + event.params._voter.toHexString()

  let voter = event.params._voter
  let sign: BigInt = event.params._position ? BIGINT_ONE : BIGINT_ONE.neg()

  let params = contract.getAllDisputeVars(disputeId)
  let isPropFork = params.value3
  let blockNumber = params.value7[5]

  let voteWeight = contract.balanceOfAt(event.params._voter, blockNumber)

  // this dumb construct is here only cause there is no support for UNIONs
  if (isPropFork) {
    let vote = new ForkVote(id)
    vote.id = id
    vote.voter = voter
    vote.vote = voteWeight.times(sign)
    vote.transaction = transaction.id
    vote.dispute = disputeId.toString()
    vote.save()
  } else {
    let vote = new SlashVote(id)
    vote.id = id
    vote.voter = voter
    vote.vote = voteWeight.times(sign)
    vote.transaction = transaction.id
    vote.dispute = disputeId.toString()
    vote.save()
  }
}

// MINERS

export function handleNewStake(event: NewStake): void {
  let block = createBlock(event.block)
  let transaction = createTransaction(event.transaction, event.block)

  let id = event.params._sender.toHexString()
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

  let id = event.params._sender.toHexString()
  let miner = Miner.load(id)
  // should never fail
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

  let id = event.params._sender.toHexString()
  let miner = Miner.load(id)
  // should never fail
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

  let id = event.params._miner.toHexString()
  let miner = Miner.load(id)
  // should never fail
  if (miner != null) {
    miner.transaction = transaction.id
    miner.status = 'ON_DISPUTE'
    if (Block.load(block.id) == null) {
      block.save()
    }
    transaction.save()
    miner.save()
  }

  // slash disputes logic here

  let disputeId = event.params._disputeId
  let slash = new Slash(disputeId.toString())

  slash.finalized = false
  slash.reporter = event.transaction.from
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

  let id = event.params._reportedMiner.toHexString()
  let miner = Miner.load(id)
  // should never fail
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

export function handleProposeFork(call: ProposeForkCall): void {
  // bind to contract to read the state
  let contract = Tellor.bind(call.to) // TODO: check that this is valid call.to

  let block = createBlock(call.block)
  let transaction = createTransaction(call.transaction, call.block)

  let id = call.transaction.from
  let miner = Miner.load(id.toHexString())
  // should never fail
  if (miner != null) {
    miner.transaction = transaction.id
    miner.status = 'ON_DISPUTE'
    if (Block.load(block.id) == null) {
      block.save()
    }
    transaction.save()
    miner.save()
  }

  let disputeId = contract.getUintVar(crypto.keccak256(stringToUTF8('disputeCount')) as Bytes)
  let fork = new Fork(disputeId.toString())

  fork.finalized = false
  fork.reporter = id
  fork.suspect = id.toHexString()

  fork.forkAddress = call.inputs._propNewTellorAddress

  fork.fee = contract.getDisputeUintVars(disputeId, crypto.keccak256(stringToUTF8('fee')) as Bytes)
  fork.endDate = contract.getDisputeUintVars(disputeId, crypto.keccak256(stringToUTF8('minExecutionDate')) as Bytes)
  fork.blockNumber = contract.getDisputeUintVars(disputeId, crypto.keccak256(stringToUTF8('blockNumber')) as Bytes)

  fork.save()
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
