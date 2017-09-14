// @flow

import type { MarcRecord } from './marc-record.flow.js';

export type MelindaRecordService = {
  loadRecord: (base: string, recordId: string, options?: any) => Promise<MarcRecord>,
  loadSubrecords: (base: string, recordId: string, options?: any) => Promise<Array<MarcRecord>>,
  createRecord: (base: string, record: MarcRecord, options?: any) => Promise<any>,
  saveRecord: (base: string, recordId: string, record: MarcRecord, options?: any) => Promise<any>
};

export type Credentials = {
  username: string,
  password: string
};
