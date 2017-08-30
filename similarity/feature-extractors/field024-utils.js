const { Labels } = require('./constants');
const compareFuncs = require('./core.compare');

const {
  hasSubfield
} = require('./utils');

// field 024 has multiple different standard numbers which share same check function.

function f024checkFunc(set1, set2) {

  return function() {

    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    if (!hasSubfield(set1, 'a') || !hasSubfield(set2, 'a')) {
      return null;
    } 

    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    if (compareFuncs.isSubset(set1, set2) || compareFuncs.isSubset(set2, set1)) {
      return Labels.SURE;
    }

    if (compareFuncs.intersection(set1, set2).length > 0) {
      return Labels.ALMOST_SURE;
    }

    return Labels.SURELY_NOT;

  };

}

var f024Normalizations = ['delChars(":-")', 'trimEnd', 'upper'];

module.exports = {
  f024checkFunc,
  f024Normalizations
};
