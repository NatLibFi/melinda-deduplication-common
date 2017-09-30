const _ = require('lodash');
const { Labels } = require('./constants');

const {
  fromXMLjsFormat,
  selectValue,
  normalizeWith,
  normalizeText,
  expandAlias,
  forMissingFeature
} = require('./utils');


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
    forMissingFeature(null, _.isEqual),
    forMissingFeature(null, _.isEqual),
    forMissingFeature(null, _.isEqual)
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
    names: featureNames.map(name => `F028-${name}`)
  };
}

module.exports = F028;

