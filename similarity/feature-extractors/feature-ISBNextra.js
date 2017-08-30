
const compareFuncs = require('./core.compare');
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone,
  parseISBN,
  getFields
} = require('./utils');

/**
  * 515 vertaus 020 kenttään. Ei vertaa 515 kenttiä keskenään!
  * 
  */

function ISBNextra(record1, record2) {

  var fields1 = select(['515','020'], record1);
  var fields2 = select(['515','020'], record2);
  
  var normalizations = ['delChars(":-")', 'trimEnd', 'upper', parseISBN];
  var normalized1 = normalize( clone(fields1) , normalizations);
  var normalized2 = normalize( clone(fields2) , normalizations);

  var set1 = normalized1;
  var set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {

    var set1_515 = getFields(set1, '515a');
    var set2_515 = getFields(set2, '515a');

    var set1_020 = getFields(set1, '020a');
    var set2_020 = getFields(set2, '020a');

    if (compareFuncs.intersection(set1_515, set2_515).length > 0) {
      return Labels.SURELY_NOT;
    }

    if (compareFuncs.intersection(set1_515, set2_020).length > 0 ||
      compareFuncs.intersection(set2_515, set1_020).length > 0) {
      return Labels.MAYBE;
    }

    return null;
  }

  return {
    check: check,
    getData: getData
  };
}


module.exports = ISBNextra;