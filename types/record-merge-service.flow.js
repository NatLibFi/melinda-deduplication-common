// @flow

import type { MarcRecord } from './marc-record.flow';

export type RecordIdentifier = {
  id: String,
  base: String
};

export type MergeResult = {
  record: RecordIdentifier
};

export type RecordMergeService = {
  checkMergeability: (firstRecord: MarcRecord, secondRecord: MarcRecord) => Promise<Boolean>,
  mergeRecords: (firstRecord: MarcRecord, secondRecord: MarcRecord) => Promise<MergeResult>
};
