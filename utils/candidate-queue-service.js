// @flow
import type { CandidateQueueService } from 'types/candidate-queue-service.flow';

function createCandidateQueueService(): CandidateQueueService {

  function pushCandidates(duplicateCandidates) {
    return Promise.reject('TODO');
  }

  return {
    pushCandidates
  };
}

module.exports = {
  createCandidateQueueService
};