const {
  normalize,
  select,
  clone,
  actOnPublicationDate,
  removeSubfields,
  subCode
} = require('./utils');

const { f024checkFunc, f024Normalizations } = require('./field024-utils.js');


function ISMN(record1, record2) {
  
  var fields1 = select(['0242.a'], record1);
  var fields2 = select(['0242.a'], record2);

  var normalized1 = normalize( clone(fields1) , f024Normalizations);
  var normalized2 = normalize( clone(fields2) , f024Normalizations);

  var removeISMNFromOldRecord = actOnPublicationDate(1992, removeSubfields(subCode('a')));
  removeISMNFromOldRecord(record1, fields1, normalized1);
  removeISMNFromOldRecord(record2, fields2, normalized2);

  var set1 = normalized1;
  var set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  return {
    check: f024checkFunc(set1, set2),
    getData: getData
  };
}

module.exports = ISMN;