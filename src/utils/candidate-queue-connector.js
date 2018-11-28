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
import {type CandidateQueueConnector, type OnCandidate} from '../types/candidate-queue-connector.flow';
import {type DuplicateCandidate} from '../types/duplicate-candidate.flow';
import {type Channel, type Message} from '../types/amqplib.flow';

const CANDIDATE_QUEUE_NAME = 'CANDIDATES';

function createCandidateQueueConnector(channel: Channel): CandidateQueueConnector {
  async function pushCandidates(duplicateCandidates) {
    await channel.assertQueue(CANDIDATE_QUEUE_NAME, {durable: true});
    for (const candidate of duplicateCandidates) {
      const payload = JSON.stringify(candidate);
      await channel.sendToQueue(CANDIDATE_QUEUE_NAME, Buffer.from(payload), {persistent: true});
    }
  }

  async function listenForCandidates(onCandidate: OnCandidate) {
    await channel.assertQueue(CANDIDATE_QUEUE_NAME, {durable: true});
    channel.prefetch(1);

    channel.consume(CANDIDATE_QUEUE_NAME, (msg: Message) => {
      if (msg != null) {
        const candidate: DuplicateCandidate = parseMessage(msg);
        const doneCallback = () => channel.ack(msg);
        onCandidate(candidate, doneCallback);
      }
    }, {noAck: false});
  }

  function parseMessage(msg: Message): DuplicateCandidate {
    const content: DuplicateCandidate = JSON.parse(msg.content.toString('utf8'));
    return content;
  }

  return {
    pushCandidates,
    listenForCandidates
  };
}

module.exports = {
  createCandidateQueueConnector
};
