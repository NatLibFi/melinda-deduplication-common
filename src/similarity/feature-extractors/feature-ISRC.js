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

const {
  normalize,
  select,
  clone
} = require('./utils');

const {f024checkFunc, f024Normalizations} = require('./field024-utils.js');

function ISRC(record1, record2) {
  const fields1 = select(['0240.a'], record1);
  const fields2 = select(['0240.a'], record2);

  const normalized1 = normalize(clone(fields1), f024Normalizations);
  const normalized2 = normalize(clone(fields2), f024Normalizations);

  const set1 = normalized1;
  const set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  return {
    check: f024checkFunc(set1, set2),
    getData
  };
}

module.exports = ISRC;
