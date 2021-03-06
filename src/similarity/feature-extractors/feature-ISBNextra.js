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
  parseISBN,
  getFields
} = require('./utils');

/**
  * 515 vertaus 020 kenttään. Ei vertaa 515 kenttiä keskenään!
  *
  */

function ISBNextra(record1, record2) {
  const fields1 = select(['515', '020'], record1);
  const fields2 = select(['515', '020'], record2);

  const normalizations = ['delChars(":-")', 'trimEnd', 'upper', parseISBN];
  const normalized1 = normalize(clone(fields1), normalizations);
  const normalized2 = normalize(clone(fields2), normalizations);

  const set1 = normalized1;
  const set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {
    const set1_515 = getFields(set1, '515a');
    const set2_515 = getFields(set2, '515a');

    const set1_020 = getFields(set1, '020a');
    const set2_020 = getFields(set2, '020a');

    if (compareFuncs.intersection(set1_515, set2_515).length > 0) {
      return Labels.SURELY_NOT;
    }

    if (compareFuncs.intersection(set1_515, set2_020).length > 0 ||
      compareFuncs.intersection(set2_515, set1_020).length > 0) {
      return Labels.MAYBE;
    }

    return null;
  }

  return {
    check,
    getData
  };
}

module.exports = ISBNextra;
