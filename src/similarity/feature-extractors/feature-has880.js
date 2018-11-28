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
  select,
  clone
} = require('./utils');

function has880(record1, record2) {
  const fields1 = select(['880'], clone(record1));
  const fields2 = select(['880'], clone(record2));

  const normalized1 = fields1;
  const normalized2 = fields2;

  const set1 = normalized1;
  const set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {
    // Return ABSOLUTELY_NOT_DOUBLE if fields have 880
    if (set1.length !== 0 || set2.length !== 0) {
      return Labels.ABSOLUTELY_NOT_DOUBLE;
    }
    return null;
  }

  return {
    check,
    getData
  };
}

module.exports = has880;
