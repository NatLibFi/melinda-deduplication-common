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

const {
  fromXMLjsFormat,
  isSubset,
  isIdentical
} = require('./utils');

function subjectAccessTerms(xmlJsrecord1, xmlJsrecord2) {
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);
  
  const getFieldValues = code => field => field && _.get(field, 'subfields', []).filter(s => s.code === code).map(s => s.value);

  const getF650a = (record) => _.flatMap(record.fields.filter(f => f.tag === '650'), getFieldValues('a'));


  const norm = (str) => str && str.replace(/\W/g, '').toUpperCase().trim();
  
  const record1Terms = getF650a(record1).map(norm);
  const record2Terms = getF650a(record2).map(norm);
  
  function check() {

    if (record1Terms.length === 0 || record2Terms.length === 0) {
      return null;
    }
  
    if (isIdentical(record1Terms, record2Terms)) {
      return Labels.SURE;
    }

    if (isSubset(record1Terms, record2Terms) || isSubset(record2Terms, record1Terms)) {
      return Labels.ALMOST_SURE;
    }

    const terms = _.concat(record1Terms, record2Terms);
    const differingTerms = _.concat(_.difference(record1Terms, record2Terms), _.difference(record2Terms, record1Terms));
    const identicalTerms = _.without(terms, ...differingTerms);
   
    return identicalTerms.length / terms.length;
  }

  return {
    check: check,
  };

}

module.exports = subjectAccessTerms;