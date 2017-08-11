// @flow

import type { MarcRecord } from './marc-record.flow';
import type { DuplicateCandidate } from './duplicate-candidate.flow';

export type DataStoreConnector = {
  loadRecord: (base: string, recordId: string) => Promise<MarcRecord>,
  loadRecordByTimestamp: (base: string, recordId: string, timestamp: number) => Promise<MarcRecord>,
  saveRecord: (base: string, recordId: string, record: MarcRecord) => Promise<any>,
  getDuplicateCandidates: (base: string, recordId: string) => Promise<Array<DuplicateCandidate>>
};