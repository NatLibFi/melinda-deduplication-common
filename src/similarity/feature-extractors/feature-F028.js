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
  forMissingFeature
} = require('./utils');


const toLabel = (t,f) => val => val === null ? null : val ? t : f;

function F028(xmlJsrecord1, xmlJsrecord2) {

  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);

  const featureNames = ['years', 'numbers', 'terms-q'];

  // Selectors
  const termsA = _.flow(selectValue('028', 'a'), normalizeWith(normalizeText, expandAlias));
  const termsB = _.flow(selectValue('028', 'b'), normalizeWith(normalizeText, expandAlias));
  const termsQ = _.flow(selectValue('028', 'q'), normalizeWith(normalizeText, expandAlias));
  
  const selectors = [termsA, termsB, termsQ];

  // Comparators
  const comparators = [
    _.flow(forMissingFeature(null, _.isEqual), toLabel(SURE, ABSOLUTELY_NOT_DOUBLE)),
    _.flow(forMissingFeature(null, _.isEqual), toLabel(SURE, SURELY_NOT)),
    _.flow(forMissingFeature(null, _.isEqual), toLabel(SURE, SURELY_NOT))  
  ];

  function check() {

    const features = _.zip(selectors, comparators).map(([select, compare]) => {
      const valueA = select(record1);
      const valueB = select(record2);

      return compare(valueA, valueB);
    });
    return features;
  }

  return {
    check: check,
    names: featureNames.map(name => `F028-${name}`)
  };
}

module.exports = F028;

