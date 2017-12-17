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
  fromXMLjsFormat
} = require('./utils');

function F007(record1, record2) {

  
  var fields1 = fromXMLjsFormat(record1).fields.filter(f => f.tag === '007');
  var fields2 = fromXMLjsFormat(record2).fields.filter(f => f.tag === '007');
 
  const set1 = fields1;
  const set2 = fields2;
  
  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [set1, set2]
    };
  }

  function check() {

    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    const equalFunc = (a,b) => a.tag === b.tag && a.value === b.value;
    equalFunc.options = {
      noNormalization: true
    };

    if (compareFuncs.isIdentical(set1, set2, equalFunc)) {
      return Labels.SURE;
    }

    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };
}

module.exports = F007;