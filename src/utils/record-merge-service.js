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
import type { RecordMergeService } from '../types/record-merge-service.flow';

const _ = require('lodash');
const createRecordMerger = require('@natlibfi/marc-record-merge');
const { createComponentRecordMatchService } = require('./component-record-match-service.js');
const PostMerge = require('../marc-record-merge-utils/marc-record-merge-postmerge-service');
const MergeValidation = require('../marc-record-merge-utils/marc-record-merge-validate-service');
import { decorateFieldsWithUuid } from '../marc-record-merge-utils/record-utils';

const MergeabilityClass = {
  NOT_MERGEABLE: 'NOT_MERGEABLE',
  MANUALLY_MERGEABLE: 'MANUALLY_MERGEABLE',
  AUTOMATICALLY_MERGEABLE: 'AUTOMATICALLY_MERGEABLE'
};

function createRecordMergeService(
  mergeConfiguration: any, 
  componentRecordMatcherConfiguration: any
): RecordMergeService {
  
  async function mergeRecords(preferredRecordFamily, otherRecordFamily, postMergeFixes = PostMerge.preset.automerge) {

    const merge = createRecordMerger(mergeConfiguration);
    
    const componentRecordMatcher = createComponentRecordMatchService(componentRecordMatcherConfiguration);
    
    const componentRecordValidationRules = MergeValidation.preset.melinda_component;
    const componentPostMergeFixes = _.clone(PostMerge.preset.automerge);

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

      decorateFieldsWithUuid(preferredRecord);
      decorateFieldsWithUuid(otherRecord);

      const mergedRecord = await merge(preferredRecord, otherRecord);
      const result = await PostMerge.applyPostMergeModifications(postMergeFixes, preferredRecord, otherRecord, mergedRecord);
      
      const fixedMergedRecord = result.record;

      const preferredRecordId = selectRecordId(preferredRecord);
      const otherRecordId = selectRecordId(otherRecord);
  
      const preferredSubrecordList = _.get(preferredRecordFamily, 'subrecords', []);
      const otherSubrecordList = _.get(otherRecordFamily, 'subrecords', []);
      
      const matchedSubrecordPairs = componentRecordMatcher.match(preferredSubrecordList, otherSubrecordList);

      if (!validateSubrecordSets(matchedSubrecordPairs)) {
        const failureMessages = ['Component record sets are not equal'];
        const error = new MergeValidation.MergeValidationError('Component record validation failed', failureMessages);
        throw wrapWithMergeabilityClass(error, MergeabilityClass.MANUALLY_MERGEABLE);
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

        decorateFieldsWithUuid(preferredRecord);
        decorateFieldsWithUuid(otherRecord);
  
        const mergedRecord = await merge(preferredRecord, otherRecord);
        const result = await PostMerge.applyPostMergeModifications(componentPostMergeFixes, preferredRecord, otherRecord, mergedRecord);
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
