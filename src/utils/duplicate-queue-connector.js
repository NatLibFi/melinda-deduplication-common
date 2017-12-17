/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Shared modules for microservices of Melinda deduplication system
 *
 * Copyright (c) 2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-deduplication-common
 *
 * melinda-deduplication-common is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * melinda-deduplication-common is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 **/

// @flow
import type { DuplicateQueueConnector, OnDuplicate } from '../types/duplicate-queue-connector.flow';
import type { Duplicate } from '../types/duplicate.flow';
import type { Channel, Message } from '../types/amqplib.flow';

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