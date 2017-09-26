const _ = require('lodash');
const { Labels } = require('./constants');

const {
  fromXMLjsFormat,
  selectValue,
  normalizeWith,
  normalizeText,
  expandAlias,
  forMissingFeature,
  isSubset
} = require('./utils');

const instrumentationTerms = `
alttoviulu
basso
harmonikka
kitaran sointuote
kitaran sointuotteet
kosketinsoitin
lapsi
lapsiäänet
lapsikuoro
laulu
lauluääni
melodia
mies
mieskuoro
nais
naiskuoro
piano
sanat
sekakuoro
sello
sointumerkit
urut
vihuela
viulu
`.split('\n').filter(_.identity).map(normalizeText);

const sentenceToWords = sentence => _.isString(sentence) ? sentence.split(' ') : sentence;
const pick = terms => list => _.isArray(list) ? list.filter(str => terms.includes(str)) : list;

function TermsInFields(xmlJsrecord1, xmlJsrecord2) {

  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);

  const featureNames = ['instrumentation-terms-500a'];

  // Selectors
  const instrumentationTerms500A = _.flow(selectValue('500', 'a'), normalizeWith(normalizeText, expandAlias, sentenceToWords, pick(instrumentationTerms)));
  
  const selectors = [instrumentationTerms500A];

  // Comparators
  const comparators = [
    forMissingFeature(null, isSubset)
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
    names: featureNames.map(name => `Terms-${name}`)
  };
}

module.exports = TermsInFields;

