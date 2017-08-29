
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone,
  getField
} = require('./utils');

function reprint(record1, record2) {

  var fields1 = select(['300..a', '250..a'], record1);
  var fields2 = select(['300..a', '250..a'], record2);

  var normalized1 = normalize( clone(fields1) , ['delChars(":-")', 'onlyNumbers', 'trimEnd', 'upper']);
  var normalized2 = normalize( clone(fields2) , ['delChars(":-")', 'onlyNumbers', 'trimEnd', 'upper']);

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

    //First, compare 250a fields
    var set1_f250a = getField(set1, '250a');
    var set2_f250a = getField(set2, '250a');

    if (set1_f250a === undefined || set2_f250a === undefined) {
      return null;
    }

    if (set1_f250a == set2_f250a) {
    
      return Labels.SURE;
    
    } else {
      var set1_f300a = getField(set1, '300a');
      var set2_f300a = getField(set2, '300a');

      //Allow 2 page difference!
      if (Math.abs(set1_f300a - set2_f300a) <= 2) {
        return Labels.ALMOST_SURE;
      }
    }

    return Labels.SURELY_NOT;

  }

  return {
    check: check,
    getData: getData
  };
}

module.exports = reprint;