// @flow

import type { RankedPair } from './preferred-record-service.flow';
import type { MarcRecord } from './marc-record.flow';

export type RecordIdentifier = {
  id: string,
  base: string
};

export type MergeResult = {
  record: RecordIdentifier
};

export type RankedSubrecords = {
  preferredSubrecords: Array<MarcRecord>,
  otherSubrecords: Array<MarcRecord>
}
export type RankedPairWithSubrecords = RankedPair & RankedSubrecords;

export type MergeabilityClass = 'NOT_MERGEABLE' | 'MANUALLY_MERGEABLE' | 'AUTOMATICALLY_MERGEABLE';

export type RecordMergeService = {
  mergeRecords: (recordPair: RankedPairWithSubrecords) => Promise<MergeResult>
};
