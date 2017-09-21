const { Labels } = require('./constants');
const _ = require('lodash');

const formatDefinitions = require('./feature-F008-formats.js');

const ANY = 'ANY';

const {
  fromXMLjsFormat,
  extractFormat
} = require('./utils');

function getExtractorsForFormat(formatCode) {
  
  const formatDefinition = formatDefinitions.find(format => format.code === formatCode);
  
  return formatDefinition.extractors.map(f => f.extractor);
}

const valueIsMissing = (part) => part.replace(/\|/g, '').replace(/\^/g, '').length === 0;

function F008(record1, record2) {
  
  const f008A = _.get(fromXMLjsFormat(record1).fields.find(f => f.tag === '008'), 'value');
  const f008B = _.get(fromXMLjsFormat(record2).fields.find(f => f.tag === '008'), 'value');
  
  const formatA = extractFormat(fromXMLjsFormat(record1));
  const formatB = extractFormat(fromXMLjsFormat(record2));

  // partition 008
  const recordDate = (f008) => f008.substr(0,6);
  const typeOfDate = (f008) => f008.substr(6,1);
  const publishDate1 = (f008) => f008.substr(7,4);
  const publishDate2 = (f008) => f008.substr(11,4);
  const country = (f008) => f008.substr(15,3) === 'xx^' ? ANY : f008.substr(15,3);
  const language = (f008) => f008.substr(33,3);
  const modifiedRecord = (f008) => f008.substr(38,1);
  const catalogingSource = (f008) => f008.substr(39,1);
  
  const extractorNames = ['recordDate', 'typeOfDate', 'publishDate1', 'publishDate2', 'country', 'language', 'modifiedRecord', 'catalogingSource'];
  const extractors = [recordDate, typeOfDate, publishDate1, publishDate2, country, language, modifiedRecord, catalogingSource];

  const formatSpecificExtractors = formatA === formatB ? getExtractorsForFormat(formatA) : undefined;

  if (formatSpecificExtractors) {
    
    const formatSpecificExtractor = (value) => {
      return formatSpecificExtractors.map(extract => extract(value));
    };

    extractorNames.push('formatSpecificExtractor');
    extractors.push(formatSpecificExtractor);
  } else {
    
    extractorNames.push('formatSpecificExtractor');
    extractors.push(() => null);
  }
  
  function check() {

    if (f008A === undefined || f008A.length === 0 || f008B === undefined || f008B.length === 0) {
      return extractors.map(() => null);
    }

    const recordA = extractors.map(extract => extract(f008A));
    const recordB = extractors.map(extract => extract(f008B));

    return _.zip(recordA, recordB)
      .map(([item1, item2]) => {
        if (item1 && item2) {
          if (item1 === ANY || item2 === ANY && item1 !== item2) {
            return Labels.ALMOST_SURE;
          }
          
          if (_.isArray(item1) && _.isArray(item2)) {
            const labels = _.zip(item1, item2).map(([a, b]) => {
              if (valueIsMissing(a) || valueIsMissing(b)) return null;
              return a === b ? 1 : 0;
            });

            const labelsWithValue = labels.filter(val => val !== null);

            return labelsWithValue.length > 0 ? _.mean(labelsWithValue) : null;
          }
          if (valueIsMissing(item1) || valueIsMissing(item2)) {
            return null; 
          }

          return item1 === item2 ? Labels.SURE : Labels.SURELY_NOT;
        }
        return null;
      });
      
  }

  return {
    check: check,
    names: extractorNames.map(name => `f008-${name}`)
  };
}

module.exports = F008;