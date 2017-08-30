const compareFuncs = require('./core.compare');
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone,
  hasSubfield
} = require('./utils');

const debug = require('debug')('feature-author245c');

// Checks for the equality of 245c, other cases should be handled by 'author' check.
function author245c(record1, record2) {
  var fields1 = select(['245..c'], clone(record1));
  var fields2 = select(['245..c'], clone(record2));

  var norm245c = ['toSpace("-")', 'delChars("\':,.")', 'trimEnd', 'upper', 'utf8norm', 'removediacs', 'removeEmpty'];
  var normalized1 = normalize(select(['245..c'], clone(record1)), norm245c);
  var normalized2 = normalize(select(['245..c'], clone(record2)), norm245c);

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

    if (!hasSubfield(set1, 'c') || !hasSubfield(set2, 'c')) {
      return null;
    } 

    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    if (compareFuncs.isIdentical(set1, set2, compareFuncs.stringPartofComparator)) {
      debug('isIdentical stringPartofComparator');
      return Labels.SURE;
    }			

    if (compareFuncs.isIdentical(set1, set2, compareFuncs.jaccardComparator(0.66))) {
      debug('isIdentical jaccardComparator0.66');
      return Labels.ALMOST_SURE;
    }

    if (compareFuncs.isIdentical(set1, set2, compareFuncs.lvComparator(0.75))) {
      debug('isIdentical lvComparator.75');
      return Labels.ALMOST_SURE;
    }
    
    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };
}

module.exports = author245c;