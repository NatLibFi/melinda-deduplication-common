const compareFuncs = require('./core.compare');
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone
} = require('./utils');


function sarjat(record1, record2) {
  var fields1 = select(['490', '830'], record1);
  var fields2 = select(['490', '830'], record2);

  var normalized1 = clone(fields1);
  var normalized2 = clone(fields2);

  normalized1 = normalize( normalized1 , ['onlyNumbers', 'trim', 'sortContent'], {subcode: 'v'}); 
  normalized2 = normalize( normalized2 , ['onlyNumbers', 'trim', 'sortContent'], {subcode: 'v'});

  var normalizations = ['utf8norm', 'removediacs', 'delChars("\':;,.")', 'trimEnd', 'upper']; // ['toSpace("-")', 'delChars("\':,.")', 'trimEnd', 'upper', 'utf8norm', 'removediacs', 'sortContent']);
  normalized1 = normalize( normalized1 , normalizations); 
  normalized2 = normalize( normalized2 , normalizations);


  var set1 = normalized1;
  var set2 = normalized2;

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }
  
  function check() {

    //if both are missing, we skip the step.
    if (set1.length === set2.length === 0) {
      return null;
    }

    //if other is missing, then we skip the step
    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    var wholeFieldComparator = function(field1, field2) {
      var subs1 = field1.subfield;
      var subs2 = field2.subfield;

      return isSubset(subs1, subs2) && isSubset(subs2, subs1);

      function isSubset(smallerSet, largerSet) {

        var identical = true;
        smallerSet.forEach(function(sub1) {

          var found = largerSet.some(function(sub2) {

            return (sub1.$.code == sub2.$.code && sub1._ == sub2._);
          
          });

          if (!found) {
            identical = false;
          }
        });
        return identical;
      }

    };
    //This will prevent the normalization of fields and subfields into sets, so that comparator can compare marc fields as marc fields instead of sets of strings.
    wholeFieldComparator.options = {
      noNormalization: true
    };

    //if the sets are identical, we are sure
    if (compareFuncs.isIdentical(set1, set2, wholeFieldComparator)) {
      return Labels.SURE;
    }

    // ISSN check could handle cases when there is a typo (determined by tarkistusnumero)


    //if other set is subset of the other, then we are sure
    if (compareFuncs.isSubset(set1, set2, wholeFieldComparator) || 
      compareFuncs.isSubset(set2, set1, wholeFieldComparator)) {
      return Labels.ALMOST_SURE;
    }

    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };
}

module.exports = sarjat;