const compareFuncs = require('./core.compare');
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone
} = require('./utils');


function publisher(record1, record2) {
  var fields1 = select(['260..ab'], record1);
  var fields2 = select(['260..ab'], record2);

  var norm = ['toSpace("-.")', 'delChars("\':,[]()")', 'trimEnd', 'upper', 'utf8norm', 'removediacs', 'removeEmpty'];
  var normalized1 = normalize(clone(fields1), norm);
  var normalized2 = normalize(clone(fields2), norm);

  var set1 = normalized1;
  var set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {

    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    if (compareFuncs.isIdentical(set1, set2, compareFuncs.lvComparator(0.65))) {
      return Labels.ALMOST_SURE;
    }

    if (compareFuncs.intersection(set1, set2).length > 0) {
      return 0.7;
    }

    if (compareFuncs.isIdentical(set1, set2, compareFuncs.jaccardComparator(0.5))) {
      return 0.7;
    }
    
    if (compareFuncs.hasIntersection(set1, set2, compareFuncs.jaccardComparator(0.5))) {
      return 0.5;
    }
    if (compareFuncs.hasIntersection(set1, set2, compareFuncs.stringPartofComparator)) {
      return 0.5;
    }

    return Labels.SURELY_NOT;
  }


  return {
    check: check,
    getData: getData
  };

}

module.exports = publisher;