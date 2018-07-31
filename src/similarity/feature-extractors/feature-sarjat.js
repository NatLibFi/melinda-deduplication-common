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

const compareFuncs = require('./core.compare');
const {Labels} = require('./constants');
const _ = require('lodash');

const {
  isSubset,
  normalize,
  select,
  clone
} = require('./utils');

function sarjat(record1, record2) {
  const fields1 = select(['490', '830'], record1);
  const fields2 = select(['490', '830'], record2);

  let normalized1 = clone(fields1);
  let normalized2 = clone(fields2);

  normalized1 = normalize(normalized1, ['onlyNumbers', 'trim', 'sortContent'], {subcode: 'v'});
  normalized2 = normalize(normalized2, ['onlyNumbers', 'trim', 'sortContent'], {subcode: 'v'});

  const normalizations = ['utf8norm', 'removediacs', 'toSpace("\':;,.")', 'collapse', 'trimEnd', 'upper']; // ['toSpace("-")', 'delChars("\':,.")', 'trimEnd', 'upper', 'utf8norm', 'removediacs', 'sortContent']);
  normalized1 = normalize(normalized1, normalizations);
  normalized2 = normalize(normalized2, normalizations);

  const set1 = normalized1;
  const set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {
    // If both are missing, we skip the step.
    if (set1.length === set2.length === 0) {
      return null;
    }

    // If other is missing, then we skip the step
    if (set1.length === 0 || set2.length === 0) {
      return Labels.SURELY_NOT;
    }

    const wholeFieldComparator = function (field1, field2) {
      const subs1 = field1.subfield;
      const subs2 = field2.subfield;

      return isSubset(subs1, subs2) && isSubset(subs2, subs1);

      function isSubset(smallerSet, largerSet) {
        let identical = true;
        smallerSet.forEach(sub1 => {
          const found = largerSet.some(sub2 => {
            return (sub1.$.code == sub2.$.code && sub1._ == sub2._);
          });

          if (!found) {
            identical = false;
          }
        });
        return identical;
      }
    };
    // This will prevent the normalization of fields and subfields into sets, so that comparator can compare marc fields as marc fields instead of sets of strings.
    wholeFieldComparator.options = {
      noNormalization: true
    };

    // If the sets are identical, we are sure
    if (compareFuncs.isIdentical(set1, set2, wholeFieldComparator)) {
      return Labels.SURE;
    }

    const getValues = code => set => _.flatMap(set, set => set.subfield).filter(s => s.$.code === code).map(s => s._);
    const getX = getValues('x');

    const set1_x = getX(set1);
    const set2_x = getX(set2);

    if (set1_x.length > 0 && set2_x.length > 0) {
      if (isSubset(set1_x, set2_x) || isSubset(set2_x, set1_x)) {
        return Labels.SURE;
      }
    }

    // If other set of series fields is subset of the other, then we are sure
    if (compareFuncs.isSubset(set1, set2, wholeFieldComparator) ||
      compareFuncs.isSubset(set2, set1, wholeFieldComparator)) {
      return Labels.ALMOST_SURE;
    }

    if (compareFuncs.isSubset(set1, set2) ||
      compareFuncs.isSubset(set2, set1)) {
      return Labels.MAYBE;
    }

    return Labels.SURELY_NOT;
  }

  return {
    check,
    getData
  };
}

module.exports = sarjat;
