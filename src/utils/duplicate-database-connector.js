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
import type { DuplicateDatabaseConnector, DuplicateDatabaseConfiguration } from '../types/duplicate-database-connector.flow';

const fetch = require('node-fetch');

function createDuplicateDatabaseConnector(duplicateDBConfig: DuplicateDatabaseConfiguration): DuplicateDatabaseConnector {

  async function addDuplicatePair(first, second) {

    const msg = encodeURIComponent(duplicateDBConfig.messageForDuplicateDatabase);
    const priority = duplicateDBConfig.priorityForDuplicateDatabase;
    const reckey1 = encodeURIComponent(first.id);
    const reckey2 = encodeURIComponent(second.id);

    const url = `${duplicateDBConfig.endpoint}?a=addDouble&reckey1=${reckey1}&reckey2=${reckey2}&msg=${msg}&priority=${priority}`;
    
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
