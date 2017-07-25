// @flow
import type { DuplicateDatabaseConnector } from 'types/duplicate-database-connector.flow';

const fetch = require('node-fetch');

function createDuplicateDatabaseConnector(duplicateDBApi): DuplicateDatabaseConnector {

  function addDuplicatePair(first, second) {

    // do some fetching
  }
  
  return {
    addDuplicatePair
  };
}

module.exports = {
  createDuplicateDatabaseConnector
};
