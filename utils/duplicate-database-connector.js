// @flow
import type { DuplicateDatabaseConnector, DuplicateDatabaseConfiguration } from 'types/duplicate-database-connector.flow';

const fetch = require('node-fetch');

function createDuplicateDatabaseConnector(duplicateDBConfig: DuplicateDatabaseConfiguration): DuplicateDatabaseConnector {

  async function addDuplicatePair(first, second) {

    const msg = encodeURIComponent(duplicateDBConfig.messageForDuplicateDatabase);
    const priority = duplicateDBConfig.priorityForDuplicateDatabase;
    const reckey1 = encodeURIComponent(first.id);
    const reckey2 = encodeURIComponent(second.id);

    const url = `${duplicateDBConfig.endpoint}?a=getDouble&reckey1=${reckey1}&reckey2=${reckey2}&msg=${msg}&priority=${priority}`;
    
    const result = await fetch(url);
    if (result.status !== 200) {
      throw new Error('Failed to add duplicate to duplicate database');
    }
    return result;
  }
  
  return {
    addDuplicatePair
  };
}

module.exports = {
  createDuplicateDatabaseConnector
};
