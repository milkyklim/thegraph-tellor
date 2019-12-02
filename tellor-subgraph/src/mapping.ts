import { Transfer } from '../generated/Tellor/Tellor'
import { Transfer as TransferEvent } from '../generated/schema'

export function handleTransfer(event: Transfer): void {
  // TODO: check this one is unique
  let transferEvent = new TransferEvent(
    event.params._event.transactionLogIndex.toHex(),
  )
  transferEvent.from = event.params._from
  transferEvent.to = event.params._to
  transferEvent.amount = event.params._value
  transferEvent.save()
}
