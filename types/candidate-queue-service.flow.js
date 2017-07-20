// @flow

import type { DuplicateCandidate } from './duplicate-candidate.flow';

export type CandidateDoneCallback = () => mixed;
export type OnCandidate = (candidate: DuplicateCandidate, done: CandidateDoneCallback) => mixed;

export type CandidateQueueService = {
  pushCandidates: (duplicateCandidates: Array<DuplicateCandidate>) => Promise<any>,
  listenForCandidates: (onCandidate: OnCandidate) => Promise<any>
};
