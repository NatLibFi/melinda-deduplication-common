// @flow

import type { MarcRecord } from './marc-record.flow';

export type RecordIdentifier = {
  id: string,
  base: string
};

export type MergeResult = {
  record: RecordIdentifier
};

export type RecordMergeService = {
  checkMergeability: (firstRecord: MarcRecord, secondRecord: MarcRecord) => Promise<boolean>,
  mergeRecords: (firstRecord: MarcRecord, secondRecord: MarcRecord) => Promise<MergeResult>
};
