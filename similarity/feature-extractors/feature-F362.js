const _ = require('lodash');
const { Labels } = require('./constants');

const {
  fromXMLjsFormat,
  selectValue,
  normalizeWith,
  normalizeText,
  expandAlias,
  selectNumbers,
  isIdentical,
  isYear
} = require('./utils');

const filter = fn => arr => arr.filter(fn);
const notYear = num => !isYear(num);

const addOneToEmptySet = set => set.length === 0 ? _.concat(set, 1) : set;

function F362(xmlJsrecord1, xmlJsrecord2) {

  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);

  const featureNames = ['years', 'numbers'];

  // Selectors
  const years = _.flow(selectValue('362', 'a'), normalizeWith(normalizeText, expandAlias, selectNumbers, filter(isYear)));
  const numbers = _.flow(selectValue('362', 'a'), normalizeWith(normalizeText, expandAlias, selectNumbers, filter(notYear), addOneToEmptySet));
  
  const selectors = [years, numbers];

  // Comparators
  const comparators = [
    isIdentical,
    isIdentical
  ];

  function check() {

    const features = _.zip(selectors, comparators).map(([select, compare], i) => {
      const valueA = select(record1);
      const valueB = select(record2);

      const result = compare(valueA, valueB);

      if (result === null) {
        return null;
      } else {
        return result ? Labels.SURE : Labels.SURELY_NOT;
      }
    });
    return features;
  }

  return {
    check: check,
    names: featureNames.map(name => `F362-${name}`)
  };
}

module.exports = F362;

