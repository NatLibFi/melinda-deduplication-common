const normalizeFuncs = require('./core.normalize');
const compareFuncs = require('./core.compare');

const _ = require('lodash');

const {
  normalize,
  select,
  clone,
  hasSubfield
} = require('./utils');

const { Labels } = require('./constants');

function title(record1, record2) {

  var fields1 = select(['245..ab'], clone(record1));
  var fields2 = select(['245..ab'], clone(record2));

  const field1AB = select(['245..ab'], clone(record1));
  const field2AB = select(['245..ab'], clone(record2));

  var f246a1 = select(['246..a'], record1);
  var f246a2 = select(['246..a'], record2);

  var f245pn1 = select(['245..pn'], record1);
  var f245pn2 = select(['245..pn'], record2);

  var normalized1 = normalize(clone(fields1), ['utf8norm', 'removediacs']);
  var normalized2 = normalize(clone(fields2), ['utf8norm', 'removediacs']);

  if (fields1[0] === undefined || fields2[0] === undefined) {
    return { check: () => null };
  }
  
  fields1[0].subfield = fields1[0].subfield.concat(clone(f245pn1[0]).subfield);
  fields2[0].subfield = fields2[0].subfield.concat(clone(f245pn2[0]).subfield);
  
  
  f245pn1.forEach(collapseIdenticalNumbersFromSubfield('n'));
  f245pn2.forEach(collapseIdenticalNumbersFromSubfield('n'));


  f245pn1 = normalize(f245pn1, ['toSpace("[],=:-()/")', wordMap, 'toSpace(".")', 'romanToArabic']);
  f245pn2 = normalize(f245pn2, ['toSpace("[],=:-()/")', wordMap, 'toSpace(".")', 'romanToArabic']);

  f245pn1.forEach(abbrSubfield('n'));
  f245pn2.forEach(abbrSubfield('n'));

  fields1 = fields1.concat(f246a1);
  fields2 = fields2.concat(f246a2);
  
  normalized1.forEach(parseTitles);
  normalized2.forEach(parseTitles);

  normalized1.forEach(toFieldFragments);
  normalized2.forEach(toFieldFragments);

  normalized1 = normalized1.concat( normalize(clone(f246a1), ['utf8norm', 'removediacs']));
  normalized2 = normalized2.concat( normalize(clone(f246a2), ['utf8norm', 'removediacs']));

  var normalized_f245pn1 = normalize(clone(f245pn1), ['utf8norm', 'removediacs']);
  var normalized_f245pn2 = normalize(clone(f245pn2), ['utf8norm', 'removediacs']);

  normalized1[0].subfield = normalized1[0].subfield.concat( normalized_f245pn1[0].subfield );
  normalized2[0].subfield = normalized2[0].subfield.concat( normalized_f245pn2[0].subfield );

  normalized1 = normalize(clone(normalized1), ['toSpace("-")','delChars("\'/,.:\\"")', 'trim', 'upper', 'collapse']);
  normalized2 = normalize(clone(normalized2), ['toSpace("-")','delChars("\'/,.:\\"")', 'trim', 'upper', 'collapse']);

  return {
    check: check,
    getData: getData
  };


  function check() {

    //check function will mutate sets, so make a clone.
    var set1 = clone(normalized1);
    var set2 = clone(normalized2);

    //if both are missing, we skip the step.
    if (set1.length === set2.length === 0) {
      return null;
    }

    //if other is missing, then we skip the step
    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    if (hasSubfield(set1, 'n') || hasSubfield(set2, 'n')) {
      var rec1n = get(set1, '245', 'n').join();
      var rec2n = get(set2, '245', 'n').join();

      rec1n = withoutYears(rec1n);
      rec2n = withoutYears(rec2n);

      var numbers1 = rec1n.split('').filter(isNumber).join();
      var numbers2 = rec2n.split('').filter(isNumber).join();

      if (numbers1 !== numbers2) {
        return Labels.ABSOLUTELY_NOT_DOUBLE;
      }

    }
    // Necessary checks for n-subfield has been done, remove it from poisoning the rest of checks,
    // since it is hard to normalize because of it's many formats.
    set1.forEach(removeSubfields('n'));
    set2.forEach(removeSubfields('n'));
    
    if (!hasSubfield(set1, 'X') || !hasSubfield(set2, 'X')) {
      return null;
    }

    const pickNumbers = (str) => str.replace(/\D/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
    const set1NumbersInSubfieldA = pickNumbers(normalizeFuncs.romanToArabicConversion(get(field1AB, '245', 'a').join()));
    const set2NumbersInSubfieldA = pickNumbers(normalizeFuncs.romanToArabicConversion(get(field2AB, '245', 'a').join()));
    const set1NumbersInSubfieldB = pickNumbers(normalizeFuncs.romanToArabicConversion(get(field1AB, '245', 'b').join()));
    const set2NumbersInSubfieldB = pickNumbers(normalizeFuncs.romanToArabicConversion(get(field2AB, '245', 'b').join()));
   
    const identical = (a,b) => compareFuncs.setDifference(a, b).length === 0;

    if (!identical(set1NumbersInSubfieldA, set2NumbersInSubfieldA)) {
      return Labels.SURELY_NOT;
    }

    if (!identical(set1NumbersInSubfieldB, set2NumbersInSubfieldB)) {
      return Labels.SURELY_NOT;
    }

    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    if (compareFuncs.isSubset(set1, set2) || compareFuncs.isSubset(set2, set1)) {
      var subs1 = set1.reduce(function(memo, field) { memo = memo.concat(field.subfield); return memo; }, []);
      var subs2 = set2.reduce(function(memo, field) { memo = memo.concat(field.subfield); return memo; }, []);


      var ratio = Math.min(subs1.length, subs2.length) / Math.max(subs1.length, subs2.length);
      
      if (ratio >= 0.5 ) {
        
        return 0.5;	
      }
    }

    if (compareFuncs.isIdentical(set1, set2, compareFuncs.lvComparator(0.85))) {
      
      return Labels.ALMOST_SURE;
    }

    // if one set has strings that are contained is the set of other strings
    if (compareFuncs.isIdentical(set1, set2, compareFuncs.stringPartofComparatorRatio(0.75))) {
      return Labels.ALMOST_SURE;
    }		

    // if one set has strings that are contained is the set of other strings
    if (compareFuncs.isIdentical(set1, set2, compareFuncs.stringPartofComparator)) {
      return 0.3;
    }		

    return Labels.SURELY_NOT;

    // removes words that are 4 characters long and between 1000 and 2100 (exclusive)
    function withoutYears(str) {
      str = str.split(' ').filter(function(str) { return !isYear(str); }).join(' ');
      return str;
    }
    function isYear(str) {

      if (str.length != 4) return false;
      if (isNaN(str)) return false;
      var number = parseInt(str, 10);

      return number < 2100 && number > 1000;
    }

    function removeSubfields(subCode) {
      return function(field) {
        field.subfield = field.subfield.filter(function(subfield) {
          return (subfield.$.code !== subCode);
        });
      };
    }

    function isNumber(char) {
      if (char === '' || char === ' ') return false;
      return !isNaN(char);
    }

    function get(set, tag, subCode) {
      var contents = [];
      set.forEach(function(field) {
        if (field.$.tag == tag) {
          field.subfield.forEach(function(subfield) {
            if (subfield.$.code === subCode) {
              contents.push(subfield._);
            }
          });
        }
      });
      return contents;
    }
  }


  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function toFieldFragments(field) {
    var newSubfields = field.subfield.map(function(subfield) {
      var parts = subfield._.split(':');
      return parts.map(function(part) {
        return {
          '_': part.trim(),
          '$': { code: 'X' }
        };
      });
    });
    
    field.subfield = _.flatten(newSubfields);
  }

  function parseTitles(field) {
    var str1 = _(field.subfield).reduce(function(memo, subfield) {
      return memo + subfield._ + ' ';
    }, '');

    field.subfield = str1.split('=').map(function(subfieldContent) {
      return {
        '_': subfieldContent.trim(),
        '$': { code: 'X' }
      };
    });
  }		
  function abbrSubfield(subCode) {
    return function(field) {
      field.subfield.forEach(function(subfield) {
        if (subfield.$.code == subCode) {
          subfield._ = subfield._.split(' ').map(abbr).sort().join(' ');
        }
      });
    };
    function abbr(str) {
      if (isNaN(str[0])) return str[0];
      return str;
    }
  }
}


function wordMap(fields) {
  normalizeFuncs.applyToFieldValues(fields, function(content) {
    return content.split(' ').map(translate).join(' ');
  }, {});

  return fields;
  function translate(word) {
    return map245n(word);
  }
}


//This will turn this:
//  Osa 6 = Del 6 = Part 6
//into this:
//  Osa = Del = Part 6
function collapseIdenticalNumbersFromSubfield(code) {
  return function(field) {

    field.subfield.forEach(function(subfield) {
      if (subfield.$.code == code) {
        var subfieldParts = subfield._.split('=');
        var numbers = subfieldParts.map(function(part) {
          return part.replace(/\D/g, '');
        });
        var texts = subfieldParts.map(function(part) {
          return part.replace(/[^\D]/g, '').replace(/\s+/,' ');
        });

        subfield._ = texts.join('=') + _.uniq(numbers).join(' ');
        
      }

    });
  };
}

const map245n_data = {
  'one': 1,
  'two': 2,
  'second': 2,
  'three': 3,
  'fourth': 4,
  'fifth': 5,

  'ensimmäinen': 1,
  'toinen': 2,
  'kolmas': 3,
  'neljäs': 4,
  'viides': 5,
  'kuudes': 6,
  'seitsemäs': 7,
  
  'första': 1,
  'andra': 2,
  'tredje': 3,
  'fjärde': 4,
  'femte': 5,
  'd.': 'Del', //D is 500 in roman numbers so expand it to prevent conversion to 500

  'erster': 1,
};

function map245n(word) {
  return map245n_data[word.toLowerCase()] || word;
}

module.exports = title;