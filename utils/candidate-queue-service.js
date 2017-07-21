// @flow
import type { CandidateQueueService, OnCandidate } from 'types/candidate-queue-service.flow';
import type { DuplicateCandidate } from 'types/duplicate-candidate.flow';
import type { Channel, Message } from 'types/amqplib.flow';

const CANDIDATE_QUEUE_NAME = 'CANDIDATES';

function createCandidateQueueService(channel: Channel): CandidateQueueService {

  async function pushCandidates(duplicateCandidates) {
    await channel.assertQueue(CANDIDATE_QUEUE_NAME, {durable: true});
    for (let candidate of duplicateCandidates) {
      const payload = JSON.stringify(candidate);
      await channel.sendToQueue(CANDIDATE_QUEUE_NAME, Buffer.from(payload), {persistent: true});
    }
  }

  async function listenForCandidates(onCandidate: OnCandidate) {
    await channel.assertQueue(CANDIDATE_QUEUE_NAME, {durable: true});
    channel.prefetch(1);
    
    channel.consume(CANDIDATE_QUEUE_NAME, (msg: Message) => {

      if (msg != null) {
        // parse message

        const candidate: DuplicateCandidate = parseMessage(msg);

        // the callback has done callback that will do the ack.
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
  createCandidateQueueService
};