// @flow

import type { MarcRecord } from './marc-record.flow';
import type { DuplicateCandidate } from './duplicate-candidate.flow';

export type DataStoreService = {
  loadRecord: (base: string, recordId: string) => Promise<MarcRecord>,
  addRecord: (base: string, recordId: string, record: MarcRecord) => Promise<any>,
  getDuplicateCandidates: (base: string, recordId: string) => Promise<Array<DuplicateCandidate>>
};
