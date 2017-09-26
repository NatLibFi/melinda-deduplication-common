const _ = require('lodash');
const { Labels } = require('./constants');

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

const compareNumbers = (allowedDiff) => (numA, numB) => {
  if (typeof allowedDiff === 'string') {
    const percentDiff = (parseInt(allowedDiff) + 100) / 100;
    return Math.max(numA, numB) / Math.min(numA, numB) <= percentDiff;
  }
  return Math.abs(numA - numB) <= allowedDiff;
};

const compareNumberSets = (allowedDiff) => (listA, listB) => {

  return isSubsetWith(listA, listB, compareNumbers(allowedDiff)) 
      || isSubsetWith(listB, listA, compareNumbers(allowedDiff));
};

const removeSuffix = word => word.length > 6 ? word.substr(0, word.length-3) : word;

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

  return isSubsetWith(shortenedA, shortenedB, startsOrEndsComparator) 
      || isSubsetWith(shortenedB, shortenedA, startsOrEndsComparator);
};

const forMissingFeature = (labelIfEitherIsMissingFeature, comparator) => (itemA, itemB) => {
  
  const containsData = (item) => {
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


// keep only items that are not numbers and equal or longer than 2 characters
const words = (sentence) => sentence.split(' ').filter(word => isNaN(word)).filter(word => word.length >= 2);

// number if sentence starts with a number, otherwise 1
const initNumber = (sentence) => {
  return _.isString(sentence) ? isNaN(sentence.charAt(0)) ? 1 : _.get(selectNumbers(sentence), '[0]', null) : null;
};

function size(xmlJsrecord1, xmlJsrecord2) {

  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);

  const featureNames = ['numbers-a', 'terms-a', 'terms-b', 'numbers-c', 'terms-e', 'numbers-e'];


  // Selectors
  const numbersA = _.flow(selectValue('300', 'a'), normalizeWith(normalizeText, expandAlias, selectNumbers, _.max));
  const termsA = _.flow(selectValue('300', 'a'), normalizeWith(normalizeText, dropNumbers, expandAlias, words));
  const termsB = _.flow(selectValue('300', 'b'), normalizeWith(normalizeText, dropNumbers, expandAlias, words));
  const numbersC = _.flow(selectValue('300', 'c'), normalizeWith(normalizeText, expandAlias, selectNumbers));
  const termsE = _.flow(selectValue('300', 'e'), normalizeWith(normalizeText, dropNumbers, expandAlias, words));
  const numbersE = _.flow(selectValue('300', 'e'), normalizeWith(normalizeText, expandAlias, initNumber));
  
  const selectors = [numbersA, termsA, termsB, numbersC, termsE, numbersE];

  // Comparators
  const comparators = [
    forMissingFeature(null, compareNumbers('2%')), 
    forMissingFeature(null, compareStringSubsets), 
    forMissingFeature(null, compareStringSubsets), 
    forMissingFeature(null, compareNumberSets(1)), 
    forMissingFeature(Labels.SURELY_NOT, compareStringSets),
    forMissingFeature(null, compareNumbers(0))
  ];

  function check() {

    return _.zip(selectors, comparators).map(([select, compare], i) => {
      const valueA = select(record1);
      const valueB = select(record2);

      const result = compare(valueA, valueB);
      if (result === null) {
        return null;
      } else {
        return result ? Labels.SURE : Labels.SURELY_NOT;
      }
    });

  }

  return {
    check: check,
    names: featureNames.map(n => `size-${n}`)
  };
}

module.exports = size;

