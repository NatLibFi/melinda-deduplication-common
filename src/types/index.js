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

import * as AlephRecordService from './aleph-record-service.flow.js';
import * as AMPQLib from './amqplib.flow.js';
import * as CandidateQueueConnector from './candidate-queue-connector.flow.js';
import * as Change from './change.flow.js';
import * as DatastoreConnector from './datastore-connector.flow.js';
import * as DuplicateCandidate from './duplicate-candidate.flow.js';
import * as DuplicateDatabaseConnector from './duplicate-database-connector.flow.js';
import * as Duplicate from './duplicate.flow.js';
import * as DuplicateQueueConnector from './duplicate-queue-connector.flow.js';
import * as Logger from './logger.flow.js';
import * as MarcRecord from './marc-record.flow.js';
import * as MarcRecordService from './melinda-record-service.flow.js';
import * as PreferredRecordService from './preferred-record-service.flow.js';
import * as RecordMergeService from './record-merge-service.flow.js';

export {
  AlephRecordService,
  AMPQLib,
  CandidateQueueConnector,
  Change,
  DatastoreConnector,
  DuplicateCandidate,
  DuplicateDatabaseConnector,
  Duplicate,
  DuplicateQueueConnector,
  Logger,
  MarcRecord,
  MarcRecordService,
  PreferredRecordService,
  RecordMergeService
};