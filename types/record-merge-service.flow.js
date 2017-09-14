// @flow

import type { MarcRecord } from './marc-record.flow';

export type RecordIdentifier = {
  id: string,
  base: string
};

export type RecordFamily = {
  record: MarcRecord,
  subrecords: Array<MarcRecord>
};

export type MergeResult = {
  mergedRecordFamily: RecordFamily
};

export type MergeabilityClass = 'NOT_MERGEABLE' | 'MANUALLY_MERGEABLE' | 'AUTOMATICALLY_MERGEABLE';

export type RecordMergeService = {
  mergeRecords: (preferredRecordFamily: RecordFamily, otherRecordFamily: RecordFamily) => Promise<MergeResult>
};
