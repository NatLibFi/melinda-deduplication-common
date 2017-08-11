// @flow
import type { DataStoreConnector } from 'types/datastore-connector.flow';
const fetch = require('node-fetch');
const MarcRecord = require('marc-record-js');
const logger = require('./logger');

function createDataStoreConnector(datastoreAPI: string): DataStoreConnector {

  async function saveRecord(base, recordId, record) {
    
    const url = `${datastoreAPI}/record/${base}/${recordId}`;
    logger.log('info', `Saving record to url: ${url}`);
    logger.log('info', `Record:\n${record.toString()}`);
    const result = await fetch(url, { 
      method: 'PUT', 
      body: JSON.stringify(record),
      headers: { 'Content-Type': 'application/json' }
    });
    if (result.status === 400) {
      const reason = await result.text();
      throw InvalidRecordError(reason);
    }
    if (result.status !== 200) {
      throw new Error(result.statusText);
    }
  }

  async function loadRecord(base, recordId) { 
    const url = `${datastoreAPI}/record/${base}/${recordId}`;
    logger.log('info', `Loading record from url: ${url}`);
    const result = await fetch(url);
    if (result.status === 200) {
      const json = await result.json();
      const record = new MarcRecord(json);
      return record;    
    } else {
      const error = new Error(result.statusText);
      error.name = 'NOT_FOUND';
      throw error;
    }
  }

  async function loadRecordByTimestamp(base, recordId, timestamp) { 
    const url = `${datastoreAPI}/record/${base}/${recordId}/version/${timestamp}`;
    logger.log('info', `Loading record from url: ${url}`);
    const result = await fetch(url);
    if (result.status === 200) {
      const json = await result.json();
      const record = new MarcRecord(json);
      return record;
    } else {
      const error = new Error(result.statusText);
      error.name = 'NOT_FOUND';
      throw error;
    }
  }

  async function loadRecordHistory(base, recordId) { 
    const url = `${datastoreAPI}/record/${base}/${recordId}/history`;
    logger.log('info', `Loading record from url: ${url}`);
    const result = await fetch(url);
    if (result.status === 200) {
      const history = await result.json();
      return history;   
    } else {
      const error = new Error(result.statusText);
      error.name = 'NOT_FOUND';
      throw error;
    }
  }

  async function getDuplicateCandidates(base, recordId) {
    const url = `${datastoreAPI}/candidates/${base}/${recordId}`;
    logger.log('info', `Loading duplicate candidate set from url: ${url}`);
    const result = await fetch(url);
    const json = await result.json();
    return json;
  }

  return {
    saveRecord,
    loadRecord,
    loadRecordByTimestamp,
    getDuplicateCandidates,
    loadRecordHistory
  };
}

function InvalidRecordError(reason) {
  const error = new Error(reason);
  error.name = 'INVALID_RECORD';
  throw error;
}


module.exports = {
  createDataStoreConnector
};