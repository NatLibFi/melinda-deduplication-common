// @flow
import type { RecordMergeService } from 'types/record-merge-service.flow';
import type { MelindaRecordService } from 'types/melinda-record-service.flow';

function createRecordMergeService(melindaConnector: MelindaRecordService): RecordMergeService {
  
  async function checkMergeability(firstRecord, secondRecord) {
    return false;
  }
  
  async function mergeRecords(firstRecord, secondRecord) {
    // create merged
    // remove old ones
    // add new one
    // return mergeResult
    // rollback on failure
    // dont follow deleted redirects when rollbacking
  }

  return {
    checkMergeability,
    mergeRecords
  };
}

module.exports = {
  createRecordMergeService
};
