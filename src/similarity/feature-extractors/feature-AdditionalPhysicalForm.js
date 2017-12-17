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
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone,
  parseISBN,
  getFields
} = require('./utils');

function AdditionalPhysicalForm(record1, record2) {

  var fields1 = select(['530','020'], record1);
  var fields2 = select(['530','020'], record2);

  var normalizations = ['delChars(":-")', 'trimEnd', 'upper', parseISBN];
  var normalized1 = normalize( clone(fields1) , normalizations);
  var normalized2 = normalize( clone(fields2) , normalizations);

  var set1 = normalized1;
  var set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {

    var set1_530 = getFields(set1, '530a');
    var set2_530 = getFields(set2, '530a');

    var set1_020 = getFields(set1, '020a');
    var set2_020 = getFields(set2, '020a');

    if (compareFuncs.isSubset(set2_020, set1_530).length > 0 ||
      compareFuncs.isSubset(set1_020, set2_530).length > 0) {
      return Labels.ABSOLUTELY_NOT_DOUBLE;
    }

    return null;
  }


  return {
    check: check,
    getData: getData
  };
}

module.exports = AdditionalPhysicalForm;
