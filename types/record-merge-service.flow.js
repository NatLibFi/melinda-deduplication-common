// @flow

import type { RankedPair } from './preferred-record-service.flow';

export type RecordIdentifier = {
  id: string,
  base: string
};

export type MergeResult = {
  record: RecordIdentifier
};

export type MergeabilityClass = 'NOT_MERGEABLE' | 'MANUALLY_MERGEABLE' | 'AUTOMATICALLY_MERGEABLE';

export type RecordMergeService = {
  mergeRecords: (recordPair: RankedPair) => Promise<MergeResult>
};
