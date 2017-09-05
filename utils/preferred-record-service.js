// @flow

import type { PreferredRecordService } from 'types/preferred-record-service.flow';
import type { Logger } from 'types/logger.flow';

const _ = require('lodash');
const synaptic = require('synaptic');
const Network = synaptic.Network;
const SelectBetter = require('melinda-deduplication-common/select-better');

function createPreferredRecordService(model: Object): PreferredRecordService {

  const network = Network.fromJSON(model);

  function selectPreferredRecord(firstRecord, secondRecord) {

    const features1 = SelectBetter.generateFeatures(firstRecord, SelectBetter.ExtractorPreset.Default);
    const features2 = SelectBetter.generateFeatures(secondRecord, SelectBetter.ExtractorPreset.Default);
    
    const vector1 = SelectBetter.generateFeatureVector(features1);
    const vector2 = SelectBetter.generateFeatureVector(features2);

    SelectBetter.normalizeFeatureVectors(vector1, vector2, SelectBetter.NormalizerPreset.Default);

    const inputVector = _.concat(vector1, vector2);

    // 0 means first is better, 1 means second is better
    const label = network.activate(inputVector)[0];
    
    const preferredRecord = label < 0.5 ? firstRecord : secondRecord;
    const otherRecord = label < 0.5 ? secondRecord : firstRecord;
    
    return {
      preferredRecord, otherRecord
    };
  }

  return {
    selectPreferredRecord
  };
}

module.exports = {
  createPreferredRecordService
};
