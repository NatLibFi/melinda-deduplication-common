// @flow
import type { RecordMergeService } from 'types/record-merge-service.flow';
import type { MelindaRecordService } from 'types/melinda-record-service.flow';
import type { Logger } from 'types/logger.flow';

const _ = require('lodash');
const createRecordMerger = require('@natlibfi/marc-record-merge');
const PostMerge = require('melinda-deduplication-common/marc-record-merge-utils/marc-record-merge-postmerge-service');


function createRecordMergeService(mergeConfiguration: any, melindaConnector: MelindaRecordService, logger: Logger): RecordMergeService {
  
  async function mergeRecords({ preferredRecord, otherRecord }) {

    const merge = createRecordMerger(mergeConfiguration);
    
    const postMergeFixes = PostMerge.preset.defaults;

    try {
   
      const mergedRecord = await merge(preferredRecord, otherRecord);
      const result = await PostMerge.applyPostMergeModifications(postMergeFixes, preferredRecord, otherRecord, mergedRecord);
      
      const fixedMergedRecord = result.record;

      const preferredRecordId = selectRecordId(preferredRecord);
      const otherRecordId = selectRecordId(otherRecord);
  
      const saveRecordOptions = { bypass_low_validation: 1, handle_deleted: 1, no_rerouting: 1, bypass_index_check: 1 };

      // remove old ones

      try {
        logger.log('info', `Removing ${preferredRecordId}`);

        preferredRecord.appendField(['STA', '', '', 'a', 'DELETED']);
        updateRecordLeader(preferredRecord, 5, 'd');

        const res = await melindaConnector.saveRecord('fin01', preferredRecordId, preferredRecord, saveRecordOptions);
        logger.log('info', `Delete ok for ${preferredRecordId}`, res.messages);
      } catch(error) {
        logger.log('info', 'Failed to delete record', error);
        throw error;
      }

      try {
        logger.log('info', `Removing ${otherRecordId}`);

        otherRecord.appendField(['STA', '', '', 'a', 'DELETED']);
        updateRecordLeader(otherRecord, 5, 'd');

        const res = await melindaConnector.saveRecord('fin01', otherRecordId, otherRecord, saveRecordOptions);
        logger.log('info', `Delete ok for ${otherRecordId}`, res.messages);
      } catch(error) {
        logger.log('info', 'Failed to delete record', error);
        
        await undeleteRecord(melindaConnector, preferredRecordId);

        throw error;
      }

      // add new one

      try {
        logger.log('info', 'Saving merged record.');
        const res = await melindaConnector.createRecord('fin01', fixedMergedRecord, saveRecordOptions);
        logger.log('info', `Save ok. New record is ${res.recordId}`, res.messages);
        return {
          record: {
            base: 'FIN01',
            id: res.recordId
          }
        };
        
      } catch(error) {
        logger.log('info', 'Failed to add merged record', error);
        await undeleteRecord(melindaConnector, preferredRecordId);
        await undeleteRecord(melindaConnector, otherRecordId);

        throw error;
      }
      
    } catch(error) {
      //TODO: error handling
      throw error;
    }
  }


  async function undeleteRecord(melindaConnector, recordId) {
    const base = 'fin01';
    
    logger.log('info', `Undeleting ${recordId}`);
    try {
      const record = await melindaConnector.loadRecord(base, recordId, {handle_deleted:1, no_rerouting: 1});

      record.fields = record.fields.filter(field => field.tag !== 'STA');
      updateRecordLeader(record, 5, 'c');
      const res = await melindaConnector.saveRecord(base, recordId, record, {bypass_low_validation: 1, handle_deleted: 1, no_rerouting: 1, bypass_index_check: 1});

      logger.log('info', `Undelete ok for ${recordId}`, res.messages);
      return res;
    } catch(err) {
      logger.log('error', 'Failed to undelete record', err);
      throw err;
    }
  }

  return {
    mergeRecords
  };
}


function selectRecordId(record) {
  return _.get(record.fields.find(field => field.tag === '001'), 'value');
}

function updateRecordLeader(record, index, characters) {
  record.leader = record.leader.substr(0,index) + characters + record.leader.substr(index+characters.length);
}

module.exports = {
  createRecordMergeService
};
