const compareFuncs = require('./core.compare');
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone,
  parseISBN,
  getFields
} = require('./utils');

function AdditionalPhysicalForm(record1, record2) {

  var fields1 = select(['530','020'], record1);
  var fields2 = select(['530','020'], record2);

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

    var set1_530 = getFields(set1, '530a');
    var set2_530 = getFields(set2, '530a');

    var set1_020 = getFields(set1, '020a');
    var set2_020 = getFields(set2, '020a');

    if (compareFuncs.isSubset(set2_020, set1_530).length > 0 ||
      compareFuncs.isSubset(set1_020, set2_530).length > 0) {
      return Labels.ABSOLUTELY_NOT_DOUBLE;
    }

    return null;
  }


  return {
    check: check,
    getData: getData
  };
}

module.exports = AdditionalPhysicalForm;
