// @flow
import type { DataStoreService } from 'types/data-store-service.flow';
const fetch = require('node-fetch');
const MarcRecord = require('marc-record-js');

const logger = require('./logger');
logger.log('info', 'Starting melinda-deduplication-listener');

function createDataStoreService(datastoreAPI: string): DataStoreService {

  async function saveRecord(base, recordId, record) {
    
    const url = `${datastoreAPI}/record/${base}/${recordId}`;
    logger.log('info', `Saving record to url: ${url}`);
    logger.log('info', `Record:\n${record.toString()}`);
    const result = await fetch(url, { 
      method: 'PUT', 
      body: JSON.stringify(record),
      headers: { 'Content-Type': 'application/json' }
    });
    if (result.status !== 200) {
      throw new Error(result.statusText);
    }
  }

  async function loadRecord(base, recordId) { 
    const url = `${datastoreAPI}/record/${base}/${recordId}`;
    logger.log('info', `Loading record from url: ${url}`);
    const result = await fetch(url);
    const json = await result.json();
    const record = new MarcRecord(json);
    return record;
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
    getDuplicateCandidates
  };
}

module.exports = {
  createDataStoreService
};