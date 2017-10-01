const compareFuncs = require('./core.compare');
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone,
  actOnPublicationDate,
  removeSubfields,
  subCode,
  hasSubfield
} = require('./utils');

function ISSN(record1, record2) {
  
  var fields1 = select(['022..ay'], record1);
  var fields2 = select(['022..ay'], record2);

  var normalized1 = normalize( clone(fields1) , ['delChars(":-")', 'trimEnd', 'upper']);
  var normalized2 = normalize( clone(fields2) , ['delChars(":-")', 'trimEnd', 'upper']);
  
  const setSubcodes = code => field => field.subfield.forEach(sub => sub.$.code = code);

  normalized1.forEach(setSubcodes('a'));
  normalized2.forEach(setSubcodes('a'));
  
  var removeISSNFromOldRecord = actOnPublicationDate(1974, removeSubfields(subCode('a')));
  removeISSNFromOldRecord(record1, fields1, normalized1);
  removeISSNFromOldRecord(record2, fields2, normalized2);

  var set1 = normalized1;
  var set2 = normalized2;


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

    //if set1 or set2 dont have any a subfields, skip
    if (!hasSubfield(set1, 'a') || !hasSubfield(set2, 'a')) {
      return null;
    } 

    //if the sets are identical, we are sure 
    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    //if other set is subset of the other, then we are sure
    if (compareFuncs.isSubset(set1, set2) || compareFuncs.isSubset(set2, set1)) {
      return Labels.SURE;
    }

    //if the sets have a single identical entry, (but some non-identical entries too) we are almost sure
    if (compareFuncs.intersection(set1, set2).length > 0) {
      return Labels.ALMOST_SURE;
    }

    //260c might be interesting
    
    
    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };
}

module.exports = ISSN;