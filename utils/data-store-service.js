// @flow
import type { DataStoreService } from 'types/data-store-service.flow';

function createDataStoreService(): DataStoreService {

  function addRecord(base, recordId) { 
    return Promise.reject('TODO'); 
  }
  function loadRecord(base, recordId, record) { 
    return Promise.reject('TODO');
  }
  function getDuplicateCandidates(base, recordId) {
    return Promise.reject('TODO');
  }

  return {
    addRecord,
    loadRecord,
    getDuplicateCandidates
  };
}

module.exports = {
  createDataStoreService
};