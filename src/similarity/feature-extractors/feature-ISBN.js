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

const { Labels } = require('./constants');
const _ = require('lodash');

const {
  convertToISBN13,
  fromXMLjsFormat,
  normalizeWith,
  selectPublicationYear,
  isSubset,
  flattenFields
} = require('./utils');

const keepNumbers = str => _.isString(str) ? str.replace(/[^\d|X]/g, '') : str;
const removeParenthesisFromEnd = str => _.isString(str) ? str.replace(/\s*\(.*\)$/, '') : str;
const removeCheckDigit = str => _.isString(str) ? str.substr(0,12) : str;

const selectISBNs = record => flattenFields(record.fields)
  .filter(sub => sub.tag === '020' && ['a','z'].includes(sub.code))
  .map(s => s.value);

const selectNormalizedISBNs = record => {
  const normalizer = normalizeWith(removeParenthesisFromEnd, keepNumbers, convertToISBN13, removeCheckDigit);
  return selectPublicationYear(record) > 1971 ? selectISBNs(record).map(normalizer).filter(isbn => isbn.length > 3) : [];
};

function ISBN(xmlJsrecord1, xmlJsrecord2) {
  
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);
  
  const isbn1 = selectNormalizedISBNs(record1);
  const isbn2 = selectNormalizedISBNs(record2);

  function check() {

    if (isbn1.length === 0 || isbn2.length === 0) {
      return null;
    }

    // if other set is subset of the other, then we are SURE by isbn
    if (isSubset(isbn1, isbn2) || isSubset(isbn2, isbn1)) {
      return Labels.SURE;
    }

    //if the sets have a single identical entry, (but some non-identical entries too) we are almost sure by isbn
    if (_.intersection(isbn1, isbn2).length > 0) {
      return Labels.MAYBE;
    }

    // erottelevana isbnnä vois olla 7##,530 kentässä "tämä teos on kuvattu erilaisessa ilmisasussa jonka isbn on tämä" 
    // eli näitä ei yhteen!

    // jos isbn tarkistusnumero ei matsaa, niin vertaa normalisoidulla levenshteinillä?
    
    // 515 kentässä voi olla kokoteoksen isbn? 
    
    // TODO: Q-osakenttä,
    
    return Labels.SURELY_NOT;
  }

  return {
    check: check
  };
}

module.exports = ISBN;
