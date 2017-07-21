// @flow
import type { DuplicateQueueConnector, OnDuplicate } from 'types/duplicate-queue-connector.flow';
import type { Duplicate } from 'types/duplicate.flow';
import type { Channel, Message } from 'types/amqplib.flow';

const DUPLICATE_QUEUE_NAME = 'DUPLICATES';

function createDuplicateQueueConnector(channel: Channel): DuplicateQueueConnector {

  async function pushDuplicate(duplicate) {
    await channel.assertQueue(DUPLICATE_QUEUE_NAME, {durable: true});
    
    const payload = JSON.stringify(duplicate);
    await channel.sendToQueue(DUPLICATE_QUEUE_NAME, Buffer.from(payload), {persistent: true});
  
  }

  async function listenForDuplicates(onDuplicate: OnDuplicate) {
    await channel.assertQueue(DUPLICATE_QUEUE_NAME, {durable: true});
    channel.prefetch(1);
    
    channel.consume(DUPLICATE_QUEUE_NAME, (msg: Message) => {

      if (msg != null) {
        const duplicate: Duplicate = parseMessage(msg);

        // the callback has done callback that will do the ack.
        const doneCallback = () => channel.ack(msg);

        onDuplicate(duplicate, doneCallback);
      }

    }, {noAck: false});

  }

  function parseMessage(msg: Message): Duplicate {
    const content: Duplicate = JSON.parse(msg.content.toString('utf8'));
    return content;
  }

  return {
    pushDuplicate,
    listenForDuplicates
  };
}

module.exports = {
  createDuplicateQueueConnector
};