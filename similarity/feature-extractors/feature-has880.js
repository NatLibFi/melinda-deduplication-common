
const { Labels } = require('./constants');

const {
  select,
  clone,
} = require('./utils');

function has880(record1, record2) {
  
  var fields1 = select(['880'], clone(record1));
  var fields2 = select(['880'], clone(record2));

  var normalized1 = fields1;
  var normalized2 = fields2;

  var set1 = normalized1;
  var set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {

    // return ABSOLUTELY_NOT_DOUBLE if fields have 880
    if (set1.length !== 0 || set2.length !== 0) {
      return Labels.ABSOLUTELY_NOT_DOUBLE;
    }
    return null;
  }

  return {
    check: check,
    getData: getData
  };
}

module.exports = has880;