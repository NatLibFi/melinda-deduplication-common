// @flow

import type { MarcRecord } from './marc-record.flow.js';

export type MelindaRecordService = {
  loadRecord: (base: string, recordId: string) => Promise<MarcRecord>,
  createRecord: (base: string, record: MarcRecord) => Promise<any>,
  saveRecord: (base: string, recordId: string, record: MarcRecord) => Promise<any>
};

export type Credentials = {
  username: string,
  password: string
};
