const _ = require('lodash');

const compareFuncs = require('./core.compare');
const normalizeFuncs = require('./core.normalize');
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone,
  hasSubfield,
  removeSubfields,
  convertToISBN13,
  actOnPublicationDate,
  subCode
} = require('./utils');

function ISBN(record1, record2) {
  
  var fields1 = select(['020..a'], record1);
  var fields2 = select(['020..a'], record2);

  var normalized1 = normalize( clone(fields1) , ['delChars(":-")', 'trimEnd', 'upper', removeSidNid()]);
  var normalized2 = normalize( clone(fields2) , ['delChars(":-")', 'trimEnd', 'upper', removeSidNid()]);

  normalized1.forEach(removeSubfields(shortenThan('c', 3)));
  normalized2.forEach(removeSubfields(shortenThan('c', 3)));

  var removeISBNFromOldRecord = actOnPublicationDate(1972, removeSubfields(subCode('a')));
  removeISBNFromOldRecord(record1, fields1, normalized1);
  removeISBNFromOldRecord(record2, fields2, normalized2);

  normalized1.forEach(convertToISBN13);
  normalized2.forEach(convertToISBN13);


  var set1 = normalized1;
  var set2 = normalized2;


  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {

    //if ISBNs are missing, we skip the step.
    if (set1.length === set2.length === 0) {
      return null;
    }

    //if other is missing an isbn, then we skip the step
    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    //if set1 or set2 dont have any a subfields, skip
    if (!hasSubfield(set1, 'a') || !hasSubfield(set2, 'a')) {
      return null;
    }

    //if the sets are identical, we are sure by isbn
    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    //if other set is subset of the other, then we are sure by isbn
    if (compareFuncs.isSubset(set1, set2) || compareFuncs.isSubset(set2, set1)) {
      return Labels.ALMOST_SURE;
    }

    //if the sets have a single identical entry, (but some non-identical entries too) we are almost sure by isbn
    if (compareFuncs.intersection(set1, set2).length > 0) {
      return 0.6;
    }

    //erottelevana isbnnä vois olla 7##,530 kentässä "tämä teos on kuvattu erilaisessa ilmisasussa jonka isbn on tämä" eli näitä ei yhteen!

    //jos isbn tarkistusnumero ei matsaa, niin vertaa normalisoidulla levenshteinillä?
    
    //515 kentässä voi olla kokoteoksen isbn? 
    
    //TODO: Q-osakenttä,
    
    // Otherwise the isbns suggest that these are different records.
    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };
}

function removeSidNid() {
  return normalizeFuncs.replace( new RegExp(/\s*\(.*\)$/) );
}

function shortenThan(subcode, length) {
  return function(subfield) {
    return (subfield.$.code == subcode && subfield._.length < length);
  };
}

module.exports = ISBN;
