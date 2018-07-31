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

const _ = require('lodash');
const {Labels} = require('./constants');

const {SURE, SURELY_NOT, ABSOLUTELY_NOT_DOUBLE} = Labels;

const {
  fromXMLjsFormat,
  selectValue,
  normalizeWith,
  normalizeText,
  expandAlias,
  isSubsetWith,
  startsOrEndsComparator,
  selectNumbers,
  dropNumbers
} = require('./utils');

const compareNumbers = allowedDiff => (numA, numB) => {
  if (typeof allowedDiff === 'string') {
    const percentDiff = (parseInt(allowedDiff) + 100) / 100;
    return Math.max(numA, numB) / Math.min(numA, numB) <= percentDiff;
  }
  return Math.abs(numA - numB) <= allowedDiff;
};

const compareNumberSets = allowedDiff => (listA, listB) => {
  return isSubsetWith(listA, listB, compareNumbers(allowedDiff)) ||
      isSubsetWith(listB, listA, compareNumbers(allowedDiff));
};

const removeSuffix = word => word.length > 6 ? word.substr(0, word.length - 3) : word;

const compareStringSets = (listA, listB) => {
  const shortenedA = listA.map(removeSuffix);
  const shortenedB = listB.map(removeSuffix);

  const differentElements = _.concat(
    _.differenceWith(shortenedA, shortenedB, startsOrEndsComparator),
    _.differenceWith(shortenedB, shortenedA, startsOrEndsComparator)
  );

  return differentElements.length === 0;
};

const compareStringSubsets = (listA, listB) => {
  const shortenedA = listA.map(removeSuffix);
  const shortenedB = listB.map(removeSuffix);

  return isSubsetWith(shortenedA, shortenedB, startsOrEndsComparator) ||
      isSubsetWith(shortenedB, shortenedA, startsOrEndsComparator);
};

const forMissingFeature = (labelIfEitherIsMissingFeature, comparator) => (itemA, itemB) => {
  const containsData = item => {
    const isNotEmpty = (_.isString(item) || _.isArray(item)) ? item.length > 0 : true;

    return item !== null && item !== undefined && isNotEmpty;
  };

  if (containsData(itemA) && containsData(itemB)) {
    return comparator(itemA, itemB);
  }
  if (containsData(itemA) || containsData(itemB)) {
    return labelIfEitherIsMissingFeature;
  }
  return null;
};

// Keep only items that are not numbers and equal or longer than 2 characters
const words = sentence => sentence.split(' ').filter(word => isNaN(word)).filter(word => word.length >= 2);

// Number if sentence starts with a number, otherwise 1
const initNumber = sentence => {
  return _.isString(sentence) ? isNaN(sentence.charAt(0)) ? 1 : _.get(selectNumbers(sentence), '[0]', null) : null;
};

// Missing count means 1. Usually single items are not explicitly stated.
function compareCounts(a, b) {
  if (a === null && b === null) {
    return null;
  }
  const norm = val => val === null ? 1 : val;

  return norm(a) === norm(b);
}

function parseVolumes(text) {
  const words = text.replace(/(\d+)/g, ' $1 ').split(' ').filter(str => str.length > 0);
  const indexOfWordForVolume = words.findIndex(word => word.includes('NID') || word.includes('VOL'));

  if (indexOfWordForVolume != -1 && indexOfWordForVolume !== 0) {
    const volumeCount = words[indexOfWordForVolume - 1];
    return parseInt(volumeCount);
  }

  return null;
}

function size(xmlJsrecord1, xmlJsrecord2) {
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);

  const featureNames = ['numbers-a', 'terms-a', 'terms-b', 'numbers-c', 'terms-e', 'numbers-e', 'volumes-a'];

  // Selectors
  const numbersA = _.flow(selectValue('300', 'a'), normalizeWith(normalizeText, expandAlias, selectNumbers, _.max));
  const termsA = _.flow(selectValue('300', 'a'), normalizeWith(normalizeText, dropNumbers, expandAlias, words));
  const termsB = _.flow(selectValue('300', 'b'), normalizeWith(normalizeText, dropNumbers, expandAlias, words));
  const numbersC = _.flow(selectValue('300', 'c'), normalizeWith(normalizeText, expandAlias, selectNumbers));
  const termsE = _.flow(selectValue('300', 'e'), normalizeWith(normalizeText, dropNumbers, expandAlias, words));
  const numbersE = _.flow(selectValue('300', 'e'), normalizeWith(normalizeText, expandAlias, initNumber));

  const volumesA = _.flow(selectValue('300', 'a'), normalizeWith(normalizeText, parseVolumes));

  const selectors = [numbersA, termsA, termsB, numbersC, termsE, numbersE, volumesA];

  const toLabel = (t, f) => val => val === null ? null : val ? t : f;

  // Comparators
  const comparators = [
    _.flow(forMissingFeature(null, compareNumbers('2%')), toLabel(SURE, SURELY_NOT)),
    _.flow(forMissingFeature(null, compareStringSubsets), toLabel(SURE, SURELY_NOT)),
    _.flow(forMissingFeature(null, compareStringSubsets), toLabel(SURE, SURELY_NOT)),
    _.flow(forMissingFeature(null, compareNumberSets(1)), toLabel(SURE, SURELY_NOT)),
    _.flow(forMissingFeature(Labels.SURELY_NOT, compareStringSets), toLabel(SURE, SURELY_NOT)),
    _.flow(forMissingFeature(null, compareNumbers(0)), toLabel(SURE, SURELY_NOT)),
    _.flow(compareCounts, toLabel(SURE, ABSOLUTELY_NOT_DOUBLE))
  ];

  function check() {
    return _.zip(selectors, comparators).map(([select, compare]) => {
      const valueA = select(record1);
      const valueB = select(record2);

      return compare(valueA, valueB);
    });
  }

  return {
    check,
    names: featureNames.map(n => `size-${n}`)
  };
}

module.exports = size;

