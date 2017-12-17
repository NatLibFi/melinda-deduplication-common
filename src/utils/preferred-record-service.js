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

import type { PreferredRecordService } from '../types/preferred-record-service.flow';

const _ = require('lodash');
const synaptic = require('synaptic');
const Network = synaptic.Network;
const SelectBetter = require('../select-better');

function createPreferredRecordService(model: Object): PreferredRecordService {

  const network = Network.fromJSON(model);

  function selectPreferredRecord(firstRecord, secondRecord) {

    const FeatureExtractorSet = SelectBetter.ExtractorPreset.Default;

    const features1 = SelectBetter.generateFeatures(firstRecord, FeatureExtractorSet);
    const features2 = SelectBetter.generateFeatures(secondRecord, FeatureExtractorSet);
    
    const vector1 = SelectBetter.generateFeatureVector(features1);
    const vector2 = SelectBetter.generateFeatureVector(features2);

    SelectBetter.normalizeFeatureVectors(vector1, vector2, FeatureExtractorSet);

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
