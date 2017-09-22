const _ = require('lodash');
const { Labels } = require('./constants');
const compareFuncs = require('./core.compare');

const {
  fromXMLjsFormat,
  selectValue,
  normalizeWith,
  isDefined,
  empty,
  expandAlias,
  normalizeText,
  selectNumbers
} = require('./utils');


function publisher(xmlJsrecord1, xmlJsrecord2) {
  
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);
  
  const placeOfPublication = _.flow(selectValue('260', 'a'), normalizeWith(normalizeText, expandAlias));
  const nameOfPublisher = _.flow(selectValue('260', 'b'), normalizeWith(normalizeText, expandAlias));
  const dateOfPublication = _.flow(selectValue('260', 'c'), normalizeWith(normalizeText, expandAlias, selectNumbers));
  const placeOfManufacture = _.flow(selectValue('260', 'e'), normalizeWith(normalizeText, expandAlias));
  const manufacturer = _.flow(selectValue('260', 'f'), normalizeWith(normalizeText, expandAlias));
  const dateOfManufacture = _.flow(selectValue('260', 'g'), normalizeWith(normalizeText, expandAlias, selectNumbers));
  
  const extractorNames = ['placeOfPublication', 'nameOfPublisher', 'dateOfPublication', 'placeOfManufacture', 'manufacturer', 'dateOfManufacture'];
  const extractors = [placeOfPublication, nameOfPublisher, dateOfPublication, placeOfManufacture, manufacturer, dateOfManufacture];


  function check() {

    const valuesA = extractors.map(extract => extract(record1));
    const valuesB = extractors.map(extract => extract(record2));
    
    return _.zip(valuesA, valuesB).map(([a, b], i) => {
      
      const isDateField = i === 2 || i === 5;

      if (!isDefined(a,b) || empty(a,b)) {
        return null;
      }

      // no edit-distance checks for date fields.
      if (isDateField) {
        return _.isEqual(a, b) ? Labels.SURE : Labels.SURELY_NOT;  
      }

      if (a === b) {
        return Labels.SURE;
      }

      const almostSame = compareFuncs.lvComparator(0.80);

      if (almostSame(a,b)) {
        return Labels.ALMOST_SURE;
      }

      return Labels.SURELY_NOT;
    });

  }


  return {
    check: check,
    names: extractorNames
  };

}

module.exports = publisher;