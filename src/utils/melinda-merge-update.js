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
import type { MelindaRecordService } from '../types/melinda-record-service.flow';
import type { RecordFamily } from '../types/record-merge-service.flow';

import * as RecordUtils from './record-utils';
import {executeTransaction, RollbackError} from './async-transaction';
import _ from 'lodash';
import uuid from 'uuid';
import moment from 'moment';

const debug = require('debug')('melinda-merge-update');

const FUTURE_HOST_ID_PLACEHOLDER = '(FI-MELINDA)[future-host-id]';
const DEFAULT_LOGGER = { log: (...args) => debug(...args)};

export function commitMerge(
  client: MelindaRecordService, 
  base: string, 
  preferredRecord: RecordFamily, 
  otherRecord: RecordFamily, 
  mergedRecord: RecordFamily, 
  opts: any): Promise<any> {

  const logger = _.get(opts, 'logger', DEFAULT_LOGGER);

  const jobId = uuid.v4().slice(0,8);

  const preferredId = getFamilyId(preferredRecord);
  const otherId = getFamilyId(otherRecord);

  const idValidation = validateIds({ preferred: preferredId, other: otherId });
  if (idValidation.error) {
    return Promise.reject(idValidation.error);
  }

  logger.log('info', `${jobId}] Commit merge job ${jobId} started.`);
  logger.log('info', `${jobId}] Removing records ${preferredId.record} [${preferredId.subrecords.join()}], ${otherId.record} [${otherId.subrecords.join()}] and creating new ones.`);

  return createRecord(mergedRecord.record).then(res => {
    const newParentRecordId = res.recordId;

    const mergedRecordRollbackAction = () => deleteRecordById(newParentRecordId);

    mergedRecord.subrecords = mergedRecord.subrecords.map(setParentRecordId(newParentRecordId));

    const mergedSubrecordActions = mergedRecord.subrecords.map(rec => {
      return {
        action: () => createRecord(rec),
        rollback: (res) => deleteRecordById(res.recordId)
      };
    });

    const otherMainRecordAction = { 
      action: () => deleteRecordFromMelinda(otherRecord.record), 
      rollback: () => undeleteRecordFromMelinda(otherId.record) 
    };

    const otherSubrecordActions = _.zip(otherRecord.subrecords, otherId.subrecords).map(([rec, id]) => {
      return {
        action: () => deleteRecordFromMelinda(rec),
        rollback: () => undeleteRecordFromMelinda(id)
      };
    });


    const preferredMainRecordAction = { 
      action: () => deleteRecordFromMelinda(preferredRecord.record), 
      rollback: () => undeleteRecordFromMelinda(preferredId.record) 
    };

    const preferredSubrecordActions = _.zip(preferredRecord.subrecords, preferredId.subrecords).map(([rec, id]) => {
      return {
        action: () => deleteRecordFromMelinda(rec),
        rollback: () => undeleteRecordFromMelinda(id)
      };
    });

    return executeTransaction(_.concat(
      mergedSubrecordActions,
      otherSubrecordActions,
      otherMainRecordAction,
      preferredSubrecordActions,
      preferredMainRecordAction
    ), [mergedRecordRollbackAction]).then(function(results) {
      results.unshift(res);
      logger.log('info', `${jobId}] Commit merge job ${jobId} completed.`);
      const mergedHostRecordId = _.chain(results)
        .filter(result => result.operation === 'CREATE')
        .map('recordId')
        .head()
        .value();
        
      return {
        recordId: mergedHostRecordId,
        results
      };
    }).catch(function(error) {

      if (error instanceof RollbackError) {
        logger.log('error', `${jobId}] Rollback failed`);
        logger.log('error', jobId, error);
        logger.log('error', `${jobId}] Commit merge job ${jobId} failed.`);
        logger.log('info', `${jobId}] Rollback failed`);
        logger.log('info', jobId, error);
        logger.log('info', `${jobId}] Commit merge job ${jobId} failed.`);
      } else {
        error.message = `${error.message} (rollback was successful)`;
        logger.log('info', `${jobId}] Rollback was successful`);
        logger.log('info', `${jobId}] Error in transaction`, error);
        logger.log('info', `${jobId}] Commit merge job ${jobId} failed.`);
      }
      throw error;
    });
  }).catch(error => {
    error.message = `${error.message} (rollback was successful)`;
    logger.log('info', `${jobId}] Rollback was successful`);
    throw error;
  });

  function createRecord(record) {
    logger.log('info', `${jobId}] Creating new record`);
    return client.createRecord(base, record, {bypass_low_validation: 1, bypass_index_check: 1}).then(res => {
      logger.log('info', `${jobId}] Create record ok for ${res.recordId}`, res.messages);
      return _.assign({}, res, {operation: 'CREATE'});
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to create record`, err);
      const isAlephError = err => err.errors !== undefined;
      if (isAlephError(err)) {
        err.message  = _.get(err, 'errors', []).map(error => `[code=${error.code}] ${error.message}`).join();        
      }
      
      throw err;
    });
  }

  function undeleteRecordFromMelinda(recordId) {
    logger.log('info', `${jobId}] Undeleting ${recordId}`);
    return client.loadRecord(base, recordId, {handle_deleted:1, no_rerouting: 1}).then(function(record) {
      record.fields = record.fields.filter(field => field.tag !== 'STA');
      updateRecordLeader(record, 5, 'c');
      return client.saveRecord(base, recordId, record, {bypass_low_validation: 1, handle_deleted: 1, no_rerouting: 1, bypass_index_check: 1}).then(function(res) {
        logger.log('info', `${jobId}] Undelete ok for ${recordId}`, res.messages);
        return _.assign({}, res, {operation: 'UNDELETE'});
      });
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to undelete record`, err);
      throw err;
    });
  }

  function deleteRecordFromMelinda(record) {
    const recordId = getRecordId(record);
    logger.log('info', `${jobId}] Deleting ${recordId}`);
    
    record.appendField(['STA', '', '', 'a', 'DELETED']);
    updateRecordLeader(record, 5, 'd');

    return client.saveRecord(base, recordId, record, {bypass_low_validation: 1, handle_deleted: 1, no_rerouting: 1, bypass_index_check: 1}).then(function(res) {
      logger.log('info', `${jobId}] Delete ok for ${recordId}`, res.messages);
      return _.assign({}, res, {operation: 'DELETE'});
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to delete record`, err);
      throw err;
    });
  }

  function deleteRecordById(recordId) {
    logger.log('info', `${jobId}] Deleting ${recordId}`);
    return client.loadRecord(base, recordId, {handle_deleted: 1, no_rerouting: 1}).then(function(record) {
      record.appendField(['STA', '', '', 'a', 'DELETED']);
      updateRecordLeader(record, 5, 'd');
      return client.saveRecord(base, recordId, record, {bypass_low_validation: 1, handle_deleted: 1, no_rerouting: 1, bypass_index_check: 1}).then(function(res) {
        logger.log('info', `${jobId}] Delete ok for ${recordId}`, res.messages);
        return _.assign({}, res, {operation: 'DELETE'});
      });
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to delete record`, err);
      throw err;
    });
  }

}

export async function splitRecord(client: MelindaRecordService, base: string, recordId: string, opts: any): Promise<any> { 

  const logger = _.get(opts, 'logger', DEFAULT_LOGGER);
  const jobId = uuid.v4().slice(0,8);

  logger.log('info', `${jobId}] Split job ${jobId} started for record (${base})${recordId}.`);
  
  const loadRecordOptions = { handle_deleted: 1, no_rerouting: 1 };
  const record = await client.loadRecord(base, recordId, loadRecordOptions);
  
  if (RecordUtils.isComponentRecord(record)) {
    throw new Error(`Record (${base})${recordId} is a component record. Only host records are supported. Components are handled when splitting host records.`);
  }
  if (RecordUtils.isDeleted(record)) {
    throw new Error(`Record (${base})${recordId} is deleted.`);
  }

  
  const mergeMetadata = parseMergeMetadata(record);
  const latestMerge = _.last(mergeMetadata);
  
  if (latestMerge === undefined) {
    throw new Error(`Record (${base})${recordId} does not have 583 field with merge metadata.`);
  }

  const { sourceIdA, sourceIdB } = latestMerge;

  const mergedFamily = await getRecordFamily(client, base, recordId);
  const recordAFamily = await getRecordFamily(client, base, sourceIdA);
  const recordBFamily = await getRecordFamily(client, base, sourceIdB);
  
  
  const timestampStr = moment().format();
  const splitData = `583    ‡aSPLIT FROM (FI-MELINDA)${recordId}‡c${timestampStr}‡5MELINDA`;

  recordAFamily.record.appendField(RecordUtils.stringToField(splitData));
  recordBFamily.record.appendField(RecordUtils.stringToField(splitData));

  const recordAActions = createUndeleteFamilyActions(recordAFamily);
  const recordBActions = createUndeleteFamilyActions(recordBFamily);
  const mergedActions = createDeleteFamilyActions(mergedFamily);

  const actions = _.concat(recordAActions, recordBActions, mergedActions);

  try {
    logger.log('info', `${jobId}] Executing transaction with ${actions.length} actions.`);
    
    const results = await executeTransaction(actions);
    logger.log('info', `${jobId}] Split job ${jobId} completed.`);

    return {
      message: `Record (${base})${recordId} has been splitted into (${base})${sourceIdA} + (${base})${sourceIdB}`,
      results
    };

  } catch(error) {

    if (error instanceof RollbackError) {
      logger.log('error', `${jobId}] Rollback failed`);
      logger.log('error', jobId, error);
      logger.log('error', `${jobId}] Commit merge job ${jobId} failed.`);
      logger.log('info', `${jobId}] Rollback failed`);
      logger.log('info', jobId, error);
      logger.log('info', `${jobId}] Commit merge job ${jobId} failed.`);
    } else {
      error.message = `${error.message} (rollback was successful)`;
      logger.log('info', `${jobId}] Rollback was successful`);
      logger.log('info', `${jobId}] Error in transaction`, error);
      logger.log('info', `${jobId}] Commit merge job ${jobId} failed.`);
    }
    throw error;
  }

  

  function undeleteRecord(record) {
    const recordId = RecordUtils.selectRecordId(record);
    logger.log('info', `${jobId}] Undeleting (${base})${recordId}`);
    
    record.fields = record.fields.filter(field => field.tag !== 'STA');
    updateRecordLeader(record, 5, 'c');
    return client.saveRecord(base, recordId, record, {bypass_low_validation: 1, handle_deleted: 1, no_rerouting: 1, bypass_index_check: 1}).then(function(res) {
      logger.log('info', `${jobId}] Undelete ok for ${recordId}`, res.messages);
      return _.assign({}, res, {operation: 'UNDELETE'});
  
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to undelete record`, err);
      throw err;
    });
  }

  function deleteRecord(record) {
    const recordId = RecordUtils.selectRecordId(record);
    logger.log('info', `${jobId}] Deleting ${recordId}`);
  
    record.appendField(['STA', '', '', 'a', 'DELETED']);
    updateRecordLeader(record, 5, 'd');
    return client.saveRecord(base, recordId, record, {bypass_low_validation: 1, handle_deleted: 1, no_rerouting: 1, bypass_index_check: 1}).then(function(res) {
      logger.log('info', `${jobId}] Delete ok for ${recordId}`, res.messages);
      return _.assign({}, res, {operation: 'DELETE'});
  
    }).catch(err => {
      logger.log('info', `${jobId}] Failed to delete record`, err);
      throw err;
    });
  }
  
  function createUndeleteFamilyActions(family) {
    const mainRecordAction = {
      action: () => undeleteRecord(family.record), 
      rollback: () => deleteRecord(family.record) 
    };

    const componentRecordActions = family.subrecords.map(componentRecord => {
      
      return {
        action: () => undeleteRecord(componentRecord),
        rollback: () => deleteRecord(componentRecord)
      };
    });
    return _.concat(mainRecordAction, componentRecordActions);
  }

  function createDeleteFamilyActions(family) {
    const mainRecordAction = {
      action: () => deleteRecord(family.record), 
      rollback: () => undeleteRecord(family.record) 
    };

    const componentRecordActions = family.subrecords.map(componentRecord => {
      return {
        action: () => deleteRecord(componentRecord),
        rollback: () => undeleteRecord(componentRecord)
      };
    });
    return _.concat(componentRecordActions, mainRecordAction);
  }
  
  /*
  // 583    ‡aMERGED FROM (FI-MELINDA)005791366 + (FI-MELINDA)000046904‡c2015-08-18T11:03:32+03:00‡5MELINDA
  
  const latest583 = ..._
  const [sourceRecordA, sourceRecordB] = parse(latest583);

  hostIdA =
  hostIdB =
  
  const mergedFamily = 
  const recordAFamily = 
  const recordBFamily = 

  with rollbacks ??
  undelete(familyA)
  undelete(familyB)
  remove(mergedFamily)

  
  undelete {
    add 583 :: `SPLIT FROM (${base})${recordId}`
  }
*/
}



function parseMergeMetadata(record) {
  const parseMetadataField = field => {
    
    // MERGED FROM (FI-MELINDA)005791366 + (FI-MELINDA)000046904‡c2015-08-18T11:03:32+03:00‡5MELINDA
    // AUTOMATICaLLY MERGED FROM (FI-MELINDA)005791366 + (FI-MELINDA)000046904‡c2015-08-18T11:03:32+03:00‡5MELINDA

    const message = _.get(field.subfields.find(sub => sub.code === 'a'), 'value');
    const timestamp = _.get(field.subfields.find(sub => sub.code === 'c'), 'value');
    const sub5 = _.get(field.subfields.find(sub => sub.code === '5'), 'value');
    const matches = message.match(/MERGED FROM \(FI-MELINDA\)(.*) \+ \(FI-MELINDA\)(.*)/);

    if (matches === null || timestamp === undefined) {
      return null;
    }

    const [, sourceIdA, sourceIdB] = matches;
    
    return {
      sourceIdA, sourceIdB, timestamp, sub5
    };
  };

  return _.chain(record.fields)
    .filter(field => field.tag === '583')
    .map(parseMetadataField)    
    .filter(meta => meta.sub5 === 'MELINDA')
    .sortBy('timestamp')      
    .value();
}


function setParentRecordId(parentRecordId) {
  return function(componentRecord) {

    componentRecord.fields = componentRecord.fields.map((field: any) => {
      if (field.tag === '773') {
        field.subfields = field.subfields.map(sub => {
          if (sub.code === 'w' && sub.value === FUTURE_HOST_ID_PLACEHOLDER) {
            return _.assign({}, sub, {value: `(FI-MELINDA)${parentRecordId}`});
          }
          return sub;
        });
      }
      return field;
    });

    return componentRecord;

  };
}

function validateIds({preferred, other}) {
  if (!isValidId(preferred.record)) {
    return notValid('Id not found for preferred record.');
  }
  if (!isValidId(other.record)) {
    return notValid('Id not found for other record.');
  }

  const invalidPreferredSubrecordIndex = _.findIndex(preferred.subrecords, (id) => !isValidId(id));
  if (invalidPreferredSubrecordIndex !== -1) {
    return notValid(`Id not found for ${invalidPreferredSubrecordIndex+1}. subrecord from preferred record.`); 
  }
  const invalidOtherSubrecordIndex = _.findIndex(other.subrecords, (id) => !isValidId(id));
  if (invalidOtherSubrecordIndex !== -1) {
    return notValid(`Id not found for ${invalidOtherSubrecordIndex+1}. subrecord from other record.`); 
  }

  return {
    ok: true
  };

  function notValid(message) {
    return { 
      error: new Error(message) 
    }; 
  }
}

function isValidId(id) {
  return id !== undefined && !isNaN(id);
}

function getFamilyId(family) {
  return {
    record: getRecordId(family.record),
    subrecords: family.subrecords.map(getRecordId)
  };
}

function getRecordId(record) {
  return _.get(record.fields.filter(f => f.tag == '001'), '[0].value');
}

function updateRecordLeader(record, index, characters) {
  record.leader = record.leader.substr(0,index) + characters + record.leader.substr(index+characters.length);
}

async function getRecordFamily(client, base, recordId) {
  const loadRecordOptions = { handle_deleted: 1, no_rerouting: 1 };

  const record = await client.loadRecord(base, recordId, loadRecordOptions);
  const subrecords = await client.loadSubrecords(base, recordId, loadRecordOptions);

  return {
    record, subrecords
  };
}
