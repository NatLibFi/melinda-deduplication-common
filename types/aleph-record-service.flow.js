// @flow

import type { MarcRecord } from './marc-record.flow.js';

export type AlephRecordService = {
  loadRecord: (base: string, recordId: string) => Promise<MarcRecord>,
  createRecord: (base: string, record: MarcRecord) => Promise<any>,
  saveRecord: (base: string, recordId: string, record: MarcRecord) => Promise<any>
};
