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

var compareFuncs = require('./core.compare');
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone,
  hasSubfield
} = require('./utils');

function F027(record1, record2) {
  
  var fields1 = select(['027'], record1);
  var fields2 = select(['027'], record2);

  var normalized1 = normalize( clone(fields1) , ['delChars(":-")', 'trimEnd', 'upper']);
  var normalized2 = normalize( clone(fields2) , ['delChars(":-")', 'trimEnd', 'upper']);

  var set1 = normalized1;
  var set2 = normalized2;

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

    if (!hasSubfield(set1, 'a') || !hasSubfield(set2, 'a')) {
      return null;
    } 

    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    if (compareFuncs.isSubset(set1, set2) || compareFuncs.isSubset(set2, set1)) {
      return Labels.SURE;
    }

    if (compareFuncs.intersection(set1, set2).length > 0) {
      return Labels.ALMOST_SURE;
    }

    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };

}

module.exports = F027;