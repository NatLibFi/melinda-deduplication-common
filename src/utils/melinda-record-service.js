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
import type { MelindaRecordService, Credentials } from '../types/melinda-record-service.flow';

const AlephRecordService = require('./aleph-record-service');
const MelindaClient = require('melinda-api-client');
const _ = require('lodash');

function createMelindaRecordService(melindaEndpoint: String, XServer: String, credentials?: Credentials): MelindaRecordService {

  const client = new MelindaClient({
    endpoint: melindaEndpoint,
    user: _.get(credentials, 'username'),
    password: _.get(credentials, 'password')
  });
  
  const alephRecordServiceX = AlephRecordService.createAlephRecordService(XServer, credentials);

  function loadRecord(base, recordId, options) {
    if (base.toLowerCase() === 'fin01') {
      return new Promise((resolve, reject) => client.loadRecord(recordId, options).then(resolve).catch(err => reject(wrapInAlephRecordError(err))).done());
    }

    return alephRecordServiceX.loadRecord(base, recordId);
  }

  function loadSubrecords(base, recordId, options) {
    if (base.toLowerCase() !== 'fin01') {
      throw new Error(`Loading subrecords is not supported for base ${base}. Only supported base is fin01`);
    }

    return client.loadChildRecords(recordId, options);
  }

  function createRecord(base, record, options) {
    if (base.toLowerCase() === 'fin01') {
      return new Promise((resolve, reject) => client.createRecord(record, options).then(resolve).catch(err => reject(wrapInAlephRecordError(err))).done());
    }
    return saveRecord(base, '000000000', record);
  }

  function saveRecord(base, recordId, record, options) {
    if (base.toLowerCase() === 'fin01') {
      return new Promise((resolve, reject) => client.updateRecord(record, options).then(resolve).catch(err => reject(wrapInAlephRecordError(err))).done());
    }
    return alephRecordServiceX.saveRecord(base, recordId, record);
  }

  return {
    loadRecord,
    loadSubrecords,
    saveRecord,
    createRecord
  };
}

function wrapInAlephRecordError(error) {
  error.name = 'AlephRecordError';
  return error;
}

module.exports = { 
  createMelindaRecordService,
  AlephRecordError: AlephRecordService.AlephRecordError
};
