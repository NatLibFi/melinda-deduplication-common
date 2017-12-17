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

const {
  fromXMLjsFormat,
  selectValue,
  normalizeWith,
  normalizeText,
  expandAlias,
  selectNumbers,
  isIdentical,
  isYear,
  forMissingFeature,
  selectValues
} = require('./utils');

const filter = fn => arr => arr.filter(fn);
const notYear = num => !isYear(num);
const removeSquareBrackets = str => _.isString(str) ? str.replace(/\[|]/g, '') : str;
const addOneToEmptySet = set => set.length === 0 ? _.concat(set, 1) : set;

function F362(xmlJsrecord1, xmlJsrecord2) {

  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);

  const featureNames = ['years', 'numbers'];

  // Selectors
  const years = _.flow(selectValue('362', 'a'), normalizeWith(removeSquareBrackets, normalizeText, expandAlias, selectNumbers, filter(isYear)));
  const numbers = _.flow(selectValue('362', 'a'), normalizeWith(normalizeText, expandAlias, selectNumbers, filter(notYear), addOneToEmptySet));
  
  const valueMissing = record => selectValues('362', 'a')(record).length === 0;

  const selectors = [years, numbers];
  
  const toLabel = (t,f) => val => val === null ? null : val ? t : f;

  // Comparators
  const comparators = [
    _.flow(forMissingFeature(null, isIdentical), toLabel(SURE, SURELY_NOT)),
    _.flow(forMissingFeature(null, isIdentical), toLabel(SURE, ABSOLUTELY_NOT_DOUBLE)),
  ];

  function check() {

    if (valueMissing(record1) || valueMissing(record2)) {
      return [null, null];
    }
    

    const features = _.zip(selectors, comparators).map(([select, compare]) => {
      const valueA = select(record1);
      const valueB = select(record2);

      return compare(valueA, valueB);
    });
    return features;
  }

  return {
    check: check,
    names: featureNames.map(name => `F362-${name}`)
  };
}

module.exports = F362;

