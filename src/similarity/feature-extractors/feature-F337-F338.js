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

const _ = require('lodash');
const { Labels } = require('./constants');
const { SURE, SURELY_NOT, ABSOLUTELY_NOT_DOUBLE } = Labels;


const isDefined = (...args) => args.every(arg => arg !== undefined && arg !== null);

const {
  fromXMLjsFormat,
  selectValues,
  normalizeWith,
  normalizeText,
  isIdentical
} = require('./utils');

function F337_F338(xmlJsrecord1, xmlJsrecord2) {
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);
  

  const getFieldValue = (field, code) => field && _.get(field, 'subfields', []).filter(s => s.code === code).map(s => s.value).join(' ');

  const getF337a = (record) => getFieldValue(record.fields.find(f => f.tag === '337'), 'a');
  const select338a = _.flow(selectValues('338', 'a'), normalizeWith(arr => arr.map(normalizeText)));
  
  const record1F337a = getF337a(record1);
  const record2F337a = getF337a(record2);

  function check() {

    const norm = (str) => str && str.replace(/\W/g, '').toUpperCase().trim();
    const isEqual = (val1, val2) => norm(val1) === norm(val2);
    const toLabel = (t,f) => val => val === null ? null : val ? t : f;
  
    const f337result = isDefined(record1F337a, record2F337a) ? isEqual(record1F337a, record2F337a) : null;

    const set1OK = select338a(record1).length > 0;
    const set2OK = select338a(record2).length > 0;
    
    const f338result = set1OK && set2OK ? isIdentical(select338a(record1), select338a(record2)) : null;
    
    const f337Label = toLabel(SURE, SURELY_NOT)(f337result);
    const f338Label = toLabel(SURE, ABSOLUTELY_NOT_DOUBLE)(f338result);

    return [f337Label, f338Label];

  }

  return {
    check: check,
    names: ['F337', 'F338']
  };

}

module.exports = F337_F338;