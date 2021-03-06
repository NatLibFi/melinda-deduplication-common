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

import _ from 'lodash';
import jsonSimilarity from '@natlibfi/json-similarity';

export function createComponentRecordMatchService(similarityDefinition) {
  function match(recordSet1, recordSet2) {
    const matches = recordSet1.reduce((acc, record) => {
      const {pairs, availableRecords} = acc;

      const matchResult = findMatches(record, availableRecords);

      const sortedMatchResults = matchResult
        .sort((a, b) => b.similarity.points - a.similarity.points)
        .filter(result => result.similarity.match === true);

      const bestMatch = _.head(sortedMatchResults);

      const bestMatchRecord = _.get(bestMatch, 'candidate');

      pairs.push([record, bestMatchRecord]);

      return {
        pairs,
        availableRecords: _.without(availableRecords, bestMatchRecord)
      };
    }, {pairs: [], availableRecords: recordSet2});

    const recordSet2leftoverRecords = matches.availableRecords;

    matches.pairs = _.concat(matches.pairs, recordSet2leftoverRecords.map(record => [undefined, record]));

    return matches.pairs;
  }

  function findMatches(record, recordSet) {
    return recordSet.map(candidate => {
      const similarity = calculateSimilarity(record, candidate);
      return {
        candidate, similarity
      };
    });
  }

  function calculateSimilarity(record1, record2) {
    return jsonSimilarity(record1, record2, similarityDefinition);
  }

  return {
    match, findMatches
  };
}
