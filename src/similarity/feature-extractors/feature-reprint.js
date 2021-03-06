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

const {Labels} = require('./constants');

const {
  normalize,
  select,
  clone,
  getField
} = require('./utils');

function reprint(record1, record2) {
  const fields1 = select(['300..a', '250..a'], record1);
  const fields2 = select(['300..a', '250..a'], record2);

  const normalized1 = normalize(clone(fields1), ['delChars(":-")', 'onlyNumbers', 'trimEnd', 'upper']);
  const normalized2 = normalize(clone(fields2), ['delChars(":-")', 'onlyNumbers', 'trimEnd', 'upper']);

  const set1 = normalized1;
  const set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {
    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    // First, compare 250a fields
    const set1_f250a = getField(set1, '250a');
    const set2_f250a = getField(set2, '250a');

    if (set1_f250a === undefined || set2_f250a === undefined) {
      return null;
    }

    if (set1_f250a == set2_f250a) {
      return Labels.SURE;
    }
    const set1_f300a = getField(set1, '300a');
    const set2_f300a = getField(set2, '300a');

    // Allow 2 page difference!
    if (Math.abs(set1_f300a - set2_f300a) <= 2) {
      return Labels.ALMOST_SURE;
    }

    return Labels.SURELY_NOT;
  }

  return {
    check,
    getData
  };
}

module.exports = reprint;
