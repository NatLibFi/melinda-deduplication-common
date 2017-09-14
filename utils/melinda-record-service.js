// @flow
import type { MelindaRecordService, Credentials } from 'types/melinda-record-service.flow';

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
