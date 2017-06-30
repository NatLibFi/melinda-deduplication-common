// @flow

import type { DuplicateCandidate } from './duplicate-candidate.flow';

export type CandidateQueueService = {
  pushCandidates: (Array<DuplicateCandidate>) => Promise<any>
};
