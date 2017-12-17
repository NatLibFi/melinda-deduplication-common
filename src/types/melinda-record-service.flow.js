/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Shared modules for microservices of Melinda deduplication system
 *
 * Copyright (c) 2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-deduplication-common
 *
 * melinda-deduplication-common is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * melinda-deduplication-common is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 **/

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
