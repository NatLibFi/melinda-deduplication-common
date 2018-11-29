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

const {MarcRecord} = require('@natlibfi/marc-record');

const RecordSimilarity = require('./similarity');
const DEFAULT_STRATEGY = require('./similarity-strategy');

function pairToInputVector(pair) {
  const featureVector = pairToFeatureVector(pair);
  const inputVector = featureVectorToInputVector(featureVector);
  return inputVector;
}

function featureVectorToInputVector(featureVector) {
  const input = Object.keys(featureVector).map(key => {
    if (featureVector[key]) {
      if (featureVector[key] < 0) {
        return featureVector[key];
      }

      return featureVector[key] * 2 - 1;
    }
    return 0;
  });

  return input;
}

function pairToFeatureVector(pair, strategy = DEFAULT_STRATEGY) {
  const record1 = MarcRecord.clone(pair.record1);
  const record2 = MarcRecord.clone(pair.record2);

  const featureVector = RecordSimilarity.extractFeatures(strategy, record1, record2);

  return featureVector;
}

const Types = {
  TRUE_POSITIVE: 'TRUE_POSITIVE',
  FALSE_POSITIVE: 'FALSE_POSITIVE',
  TRUE_NEGATIVE: 'TRUE_NEGATIVE',
  FALSE_NEGATIVE: 'FALSE_NEGATIVE'
};

const DuplicateClass = {
  IS_DUPLICATE: 'IS_DUPLICATE',
  NOT_DUPLICATE: 'NOT_DUPLICATE',
  MAYBE_DUPLICATE: 'MAYBE_DUPLICATE'
};

module.exports = {
  pairToInputVector,
  featureVectorToInputVector,
  pairToFeatureVector,
  Types,
  DuplicateClass,
  DefaultStrategy: DEFAULT_STRATEGY
};
