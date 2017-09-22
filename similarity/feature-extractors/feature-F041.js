const compareFuncs = require('./core.compare');
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone,
  hasSubfield
} = require('./utils');


function F041(record1, record2) {
  
  var fields1 = select(['041..a'], record1);
  var fields2 = select(['041..a'], record2);

  var normalized1 = normalize( clone(fields1) , ['delChars(":-")', 'trimEnd', 'upper']);
  var normalized2 = normalize( clone(fields2) , ['delChars(":-")', 'trimEnd', 'upper']);

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

    if (!hasSubfield(set1, 'a') || !hasSubfield(set2, 'a')) {
      return null;
    } 

    if (compareFuncs.isSubset(set1, set2) || compareFuncs.isSubset(set2, set1)) {
      return Labels.SURE;
    }

    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };

}

module.exports = F041;