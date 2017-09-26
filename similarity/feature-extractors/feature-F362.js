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

  // Comparators
  const comparators = [
    forMissingFeature(null, isIdentical),
    forMissingFeature(null, isIdentical)
  ];

  function check() {

    if (valueMissing(record1) || valueMissing(record2)) {
      return [null, null];
    }
    

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

