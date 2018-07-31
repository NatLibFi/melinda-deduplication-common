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

const {
  normalize,
  select,
  clone,
  actOnPublicationDate,
  removeSubfields,
  subCode,
  hasSubfield
} = require('./utils');

function ISSN(record1, record2) {
  const fields1 = select(['022..ay'], record1);
  const fields2 = select(['022..ay'], record2);

  const normalized1 = normalize(clone(fields1), ['delChars(":-")', 'trimEnd', 'upper']);
  const normalized2 = normalize(clone(fields2), ['delChars(":-")', 'trimEnd', 'upper']);

  const setSubcodes = code => field => field.subfield.forEach(sub => sub.$.code = code);

  normalized1.forEach(setSubcodes('a'));
  normalized2.forEach(setSubcodes('a'));

  const removeISSNFromOldRecord = actOnPublicationDate(1974, removeSubfields(subCode('a')));
  removeISSNFromOldRecord(record1, fields1, normalized1);
  removeISSNFromOldRecord(record2, fields2, normalized2);

  const set1 = normalized1;
  const set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {
    // If other is missing, then we skip the step
    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    // If set1 or set2 dont have any a subfields, skip
    if (!hasSubfield(set1, 'a') || !hasSubfield(set2, 'a')) {
      return null;
    }

    // If the sets are identical, we are sure
    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    // If other set is subset of the other, then we are sure
    if (compareFuncs.isSubset(set1, set2) || compareFuncs.isSubset(set2, set1)) {
      return Labels.SURE;
    }

    // If the sets have a single identical entry, (but some non-identical entries too) we are almost sure
    if (compareFuncs.intersection(set1, set2).length > 0) {
      return Labels.ALMOST_SURE;
    }

    // 260c might be interesting

    return Labels.SURELY_NOT;
  }

  return {
    check,
    getData
  };
}

module.exports = ISSN;
