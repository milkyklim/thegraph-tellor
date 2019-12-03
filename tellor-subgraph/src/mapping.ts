import { Transfer } from '../generated/Tellor/Tellor'
import { Transfer as TransferEvent } from '../generated/schema'
import { createId } from './utils'

export function handleTransfer(event: Transfer): void {
  let id = createId(event.transaction.hash, event.logIndex)
  let transferEvent = new TransferEvent(id)
  transferEvent.from = event.params._from
  transferEvent.to = event.params._to
  transferEvent.amount = event.params._value
  transferEvent.save()
}
