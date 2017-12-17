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
import type { DataStoreConnector } from '../types/datastore-connector.flow';
const _ = require('lodash');
const fetch = require('node-fetch');
const MarcRecord = require('marc-record-js');
const DEFAULT_LOGGER = require('./logger');
const debug = require('debug')('datastore-connector');

function createDataStoreConnector(datastoreAPI: string, options: any): DataStoreConnector {

  const logger = _.get(options, 'logger', DEFAULT_LOGGER);

  async function saveRecord(base, recordId, record) {
    
    const url = `${datastoreAPI}/record/${base}/${recordId}`;
    logger.log('info', `Saving record to url: ${url}`);
    debug(`Record:\n${record.toString()}`);
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