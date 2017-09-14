// @flow
import type { RecordMergeService } from 'types/record-merge-service.flow';
import type { MelindaRecordService } from 'types/melinda-record-service.flow';
import type { Logger } from 'types/logger.flow';

const _ = require('lodash');
const createRecordMerger = require('@natlibfi/marc-record-merge');
const PostMerge = require('melinda-deduplication-common/marc-record-merge-utils/marc-record-merge-postmerge-service');
const createComponentRecordMatchService = require('./component-record-match-service.js');
const MergeValidation = require('melinda-deduplication-common/marc-record-merge-utils/marc-record-merge-validate-service');

const MergeabilityClass = {
  NOT_MERGEABLE: 'NOT_MERGEABLE',
  MANUALLY_MERGEABLE: 'MANUALLY_MERGEABLE',
  AUTOMATICALLY_MERGEABLE: 'AUTOMATICALLY_MERGEABLE'
};


function createRecordMergeService(
  mergeConfiguration: any, 
  componentRecordMatcherConfiguration: any, 
  melindaConnector: MelindaRecordService, 
  logger: Logger
): RecordMergeService {
  
  async function mergeRecords(preferredRecordFamily, otherRecordFamily) {

    const merge = createRecordMerger(mergeConfiguration);
    const componentRecordMatcher = createComponentRecordMatchService(componentRecordMatcherConfiguration);
    
    const postMergeFixes = PostMerge.preset.defaults;

    const componentRecordValidationRules = MergeValidation.preset.melinda_component;
    const componentPostMergeFixes = _.clone(PostMerge.preset.defaults);

    try {
   
      const preferredRecord = preferredRecordFamily.record;
      const otherRecord = otherRecordFamily.record;

      try {
        await MergeValidation.validateMergeCandidates(MergeValidation.preset.melinda_host, preferredRecord, otherRecord);
      } catch(error) {
        throw wrapWithMergeabilityClass(error, MergeabilityClass.NOT_MERGEABLE);
      }
      try {
        await MergeValidation.validateMergeCandidates(MergeValidation.preset.melinda_host_automerge, preferredRecord, otherRecord);
      } catch(error) {
        throw wrapWithMergeabilityClass(error, MergeabilityClass.MANUALLY_MERGEABLE);
      }

      const mergedRecord = await merge(preferredRecord, otherRecord);
      const result = await PostMerge.applyPostMergeModifications(postMergeFixes, preferredRecord, otherRecord, mergedRecord);
      
      const fixedMergedRecord = result.record;

      const preferredRecordId = selectRecordId(preferredRecord);
      const otherRecordId = selectRecordId(otherRecord);
  
      const preferredSubrecordList = preferredRecordFamily.subrecords;
      const otherSubrecordList = otherRecordFamily.subrecords;
      
      const matchedSubrecordPairs = componentRecordMatcher.match(preferredSubrecordList, otherSubrecordList);

      if (!validateSubrecordSets(matchedSubrecordPairs)) {
        throw new MergeValidation.MergeValidationError('subrecord sets are not equal');
      }
     
      const preferredHostRecordId = preferredRecordId;
      const otherHostRecordId = otherRecordId;

      // insert select773 just before sort (see: componentPostMergeFixes definition from PostMerge presets )
      componentPostMergeFixes.splice(componentPostMergeFixes.length-1, 0, PostMerge.select773Fields(preferredHostRecordId, otherHostRecordId));

      let mergedSubrecords = [];
      for (const pair of matchedSubrecordPairs) {
        const [preferredRecord, otherRecord] = pair;

        try {
          await MergeValidation.validateMergeCandidates(componentRecordValidationRules, preferredRecord, otherRecord);
        } catch(error) {
          throw wrapWithMergeabilityClass(error, MergeabilityClass.MANUALLY_MERGEABLE);
        }

        const mergedRecord = await merge(preferredRecord, otherRecord);
        const result = await PostMerge.applyPostMergeModifications(postMergeFixes, preferredRecord, otherRecord, mergedRecord);
        mergedSubrecords.push(result);
      }

      return {
        record: fixedMergedRecord,
        subrecords: mergedSubrecords.map(res => res.record)
      };

    } catch(error) {
      throw error;
    }
  }

  return {
    mergeRecords
  };
}

function validateSubrecordSets(matchedSubrecordPairs) {
  return matchedSubrecordPairs.every(([a,b]) => {
    if (a === undefined || b === undefined) {
      return false;
    }
    return true;
  });
}

function selectRecordId(record) {
  return _.get(record.fields.find(field => field.tag === '001'), 'value');
}

function wrapWithMergeabilityClass(error, mergeabilityClass) {
  if (error.name === 'MergeValidationError') {
    error.mergeabilityClass = mergeabilityClass;
  }
  return error;
}

module.exports = {
  createRecordMergeService,
  MergeabilityClass
};
