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

import * as MelindaMergeUpdate from './melinda-merge-update';
import * as MelindaRecordService from './melinda-record-service';
import * as PreferredRecordService from './preferred-record-service';
import * as RecordUtils from './record-utils';
import * as AlephRecordService from './aleph-record-service';
import * as AsyncTransaction from './async-transaction';
import * as RecordMergeCheck from './record-merge-check';
import * as CandidateQueueConnector from './candidate-queue-connector';
import * as MarcRecordUtils from './marc-record-utils';
import * as Utils from './utils';
import * as DuplicateQueueConnector from './duplicate-queue-connector';
import * as DuplicateDatabaseConnector from './duplicate-database-connector';
import * as RecordMergeService from './record-merge-service';
import * as DataStoreConnector from './datastore-connector';
import Logger from './logger';
import createTimer from './start-stop-timer';
import createComponentRecordMatchService from './component-record-match-service';

export {
  MelindaMergeUpdate,
  MelindaRecordService,
  PreferredRecordService,
  RecordUtils,
  AlephRecordService,
  AsyncTransaction,
  RecordMergeCheck,
  CandidateQueueConnector,
  MarcRecordUtils,
  Utils,
  DuplicateQueueConnector,
  DuplicateDatabaseConnector,
  RecordMergeService,
  DataStoreConnector,
  Logger,
  createTimer,
  createComponentRecordMatchService
};
