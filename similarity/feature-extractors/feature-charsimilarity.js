var nonDescriptiveFields = ['LOW', 'CAT', 'SID', '001', '005', '080'];

const normalizeFuncs = require('./core.normalize');
const compareFuncs = require('./core.compare');

const { Labels } = require('./constants');

const {
  normalize,
  clone
} = require('./utils');


function charsimilarity(record1, record2) {
  var fields1 = record1.controlfield.filter(isDescriptiveField);
  var fields2 = record2.controlfield.filter(isDescriptiveField);

  var dataFields1 = record1.datafield.filter(isDescriptiveField);
  var dataFields2 = record2.datafield.filter(isDescriptiveField);

  var normalizations = ['toSpace("-")', 'delChars("\':,.")', 'trimEnd', 'upper', 'utf8norm', 'removediacs', 'removeEmpty'];

  var normalized1 = fields1.concat(normalize(clone(dataFields1), normalizations) );
  var normalized2 = fields2.concat(normalize(clone(dataFields2), normalizations) );

  fields1 = fields1.concat(dataFields1);
  fields2 = fields2.concat(dataFields2);

  var str1 = normalizeFuncs.fieldsToString( fields1 );
  var str2 = normalizeFuncs.fieldsToString( fields2 );

  var set1 = str1;
  var set2 = str2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {

    //if other is missing, then we skip the step
    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    var change = compareFuncs.levenshtein(set1, set2 );
  
    if (change > 0.50) {
      return change;
    }

    // Otherwise suggest that these are different records.
    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };
}


function isDescriptiveField(field) {
  if (nonDescriptiveFields.indexOf(field.$.tag) != -1) {
    return false;
  }
  return true;
}

module.exports = charsimilarity;