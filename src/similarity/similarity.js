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

const _ = require('lodash');
const {toxmljsFormat} = require('./feature-extractors/utils');
const FeatureExtractors = require('./feature-extractors');

function extractFeatures(strategy, record1, record2) {
  const XMLJSrecord1 = toxmljsFormat(record1);
  const XMLJSrecord2 = toxmljsFormat(record2);

  const featureExtractionResult = executeFeatureExtractors(strategy, XMLJSrecord1, XMLJSrecord2);

  return featureExtractionResult.reduce((memo, item) => _.set(memo, item.name, item.similarity), {});
}

function executeFeatureExtractors(strategy, record1, record2) {
  return _.flatMap(strategy, extractorDefinition => {
    const Extractor = FeatureExtractors[extractorDefinition.name];
    const extractorInstance = new Extractor(record1, record2);

    const featureSimilarity = extractorInstance.check();

    if (_.isArray(featureSimilarity)) {
      const names = extractorInstance.names;
      return _.zip(names, featureSimilarity).map(([name, similarity]) => ({name, similarity}));
    }

    return {
      name: extractorDefinition.name,
      similarity: featureSimilarity
    };
  });
}

module.exports = {
  extractFeatures
};

