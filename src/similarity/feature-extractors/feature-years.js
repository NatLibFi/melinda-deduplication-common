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
  createField
} = require('./utils');

function years(record1, record2) {
  //will generate a set of years found in the record for matching
  //500a, 008 merkkipaikat 7-11 ja 12-16 + 260c tehdään vuosista setti ja verrataan niitä keskenään
  
  var fields1 = select(['260..c', '500..a'], record1);
  var fields2 = select(['260..c', '500..a'], record2);

  var rec1_008 = record1.controlfield.find(function(f) {return f.$.tag == '008'; } );
  var rec2_008 = record2.controlfield.find(function(f) {return f.$.tag == '008'; } );

  if (rec1_008 === undefined) {
    throw new Error('Record is missing field 008');
  }
  if (rec2_008 === undefined) {
    throw new Error('Record is missing field 008');
  }

  var fields_from_008_1 = [rec1_008._.substr(7,4), rec1_008._.substr(11,4)].map(createField('008','a'));
  var fields_from_008_2 = [rec2_008._.substr(7,4), rec2_008._.substr(11,4)].map(createField('008','a'));

  fields1 = fields1.concat(fields_from_008_1);
  fields2 = fields2.concat(fields_from_008_2);

  var normalized1 = normalize( clone(fields1) , ['onlyYearNumbers', 'removeEmpty']);
  var normalized2 = normalize( clone(fields2) , ['onlyYearNumbers', 'removeEmpty']);

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

    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    var equalFunc = function(a,b) {
      return a === b;
    };
    equalFunc.options = { nosubcode: true };

    if (compareFuncs.isSubset(set1, set2, equalFunc) || compareFuncs.isSubset(set2, set1, equalFunc)) {
      return Labels.ALMOST_SURE;
    }

    return Labels.SURELY_NOT;

  }

  return {
    check: check,
    getData: getData
  };
}

module.exports = years;