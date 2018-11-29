// @flow
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

const querystring = require('querystring');
const _ = require('lodash');
const fetch = require('node-fetch');
const RecordSerializers = require('@natlibfi/marc-record-serializers');
const debug = require('debug')('aleph-record-service');
const {promisify} = require('es6-promisify');
const parseString = require('xml2js').parseString;

const parseXML = promisify(parseString);

const ResponseMessageTypes = {
  WARNING: 'WARNING',
  TRIGGER: 'TRIGGER',
  MANDATORY: 'MANDATORY'
};

class AlephRecordError extends Error {
  constructor(message, code) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = 'AlephRecordError';
    this.message = message;
    this.code = code;
  }
}

function createAlephRecordService(XServer, credentials) {
  function loadRecord(base, recordId) {
    const requestUrl = `${XServer}?op=find-doc&doc_num=${recordId}&base=${base}&show_sub6=Y`;
    debug(`Fetching record from ${requestUrl}`);

    return fetch(requestUrl)
      .then(response => response.text())
      .then(parseXMLRecordResponse);
  }

  function createRecord(base, record) {
    return saveRecord(base, '000000000', record);
  }

  function saveRecord(base, recordId, record) {
    if (!credentials) {
      throw new Error('Credentials are required for saving records');
    }

    const recordInOAI_MARCXML = RecordSerializers.OAI_MARCXML.to(record);

    const declaration = '<?xml version = "1.0" encoding = "UTF-8"?>\n';

    const requestParams = querystring.stringify({
      user_name: credentials.username,
      user_password: credentials.password,
      op: 'update-doc',
      doc_num: recordId,
      library: base,
      doc_action: 'UPDATE',
      xml_full_req: `${declaration}<record>${recordInOAI_MARCXML}</record>`
    });

    debug(`Saving record ${base} / ${recordId}`);
    return fetch(XServer, {method: 'POST', body: requestParams})
      .then(response => response.text())
      .then(parseXML)
      .then(parseUpdateResponse);
  }

  function parseUpdateResponse(updateResponse) {
    const rawMessages = _.get(updateResponse, 'update-doc.error', []);
    const sessionId = _.get(updateResponse, 'update-doc.session-id', []);

    const successMessagePattern = new RegExp('.*Document: (\\d+) was updated successfully.');
    const successMessage = rawMessages.find(message => successMessagePattern.test(message));

    if (successMessage) {
      const [, recordId] = successMessagePattern.exec(successMessage);
      const messages = _.without(rawMessages, successMessage).map(parseMessage);
      debug(`record ${recordId} was updated successfully.`);
      return {recordId, messages, sessionId};
    }
    // Failed.
    const loginError = _.get(updateResponse, 'login.error', []);
    if (loginError.length) {
      throw new AlephRecordError(_.head(loginError));
    }

    const errorMessages = rawMessages.map(parseMessage);

    const failureMessages = errorMessages.filter(message => message.type === ResponseMessageTypes.MANDATORY);

    if (failureMessages.length) {
      const {code, message} = _.head(failureMessages);
      throw new AlephRecordError(message, code);
    } else {
      if (errorMessages.length) {
        const {code, message} = _.head(errorMessages);
        throw new AlephRecordError(message, code);
      }
      throw new AlephRecordError('Update failed due to unkown reason.');
    }
  }

  function parseMessage(message) {
    const messagePattern = new RegExp('^\\[(\\d+)\\] (.*?)(- (?:mandatory|warning|trigger) error)?$');

    const match = messagePattern.exec(message);

    if (match) {
      const [, code, message, type] = match;
      return {code, message, type: formatMessageType(type)};
    }
    throw new Error(`Unable to parse message: ${message}`);
  }

  function formatMessageType(rawType) {
    switch (rawType) {
      case '- trigger error': return ResponseMessageTypes.TRIGGER;
      case '- warning error': return ResponseMessageTypes.WARNING;
      case '- mandatory error': return ResponseMessageTypes.MANDATORY;
    }
  }

  function parseXMLRecordResponse(XServerXMLResponse) {
    return RecordSerializers.OAI_MARCXML.from(XServerXMLResponse);
  }

  return {
    loadRecord,
    saveRecord,
    createRecord
  };
}
module.exports = {
  createAlephRecordService,
  AlephRecordError
};
