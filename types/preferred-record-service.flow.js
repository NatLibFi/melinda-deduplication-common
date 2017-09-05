// @flow

import type { MarcRecord } from './marc-record.flow';

export type RecordIdentifier = {
  id: string,
  base: string
};

export type RankedPair = {
  preferredRecord: MarcRecord,
  otherRecord: MarcRecord
};

export type PreferredRecordService = {
  selectPreferredRecord: (firstRecord: MarcRecord, secondRecord: MarcRecord) => RankedPair,
};
