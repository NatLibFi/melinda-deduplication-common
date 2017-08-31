// @flow

import type { MarcRecord } from './marc-record.flow';

export type RecordIdentifier = {
  id: string,
  base: string
};

export type MergeResult = {
  record: RecordIdentifier
};

export type MergeabilityClass = 'NOT_MERGEABLE' | 'MANUALLY_MERGEABLE' | 'AUTOMATICALLY_MERGEABLE';

export type RecordMergeService = {
  checkMergeability: (firstRecord: MarcRecord, secondRecord: MarcRecord) => Promise<MergeabilityClass>,
  mergeRecords: (firstRecord: MarcRecord, secondRecord: MarcRecord) => Promise<MergeResult>
};
