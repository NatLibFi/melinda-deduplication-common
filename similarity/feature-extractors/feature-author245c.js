const compareFuncs = require('./core.compare');
const { Labels } = require('./constants');
const _ = require('lodash');

const {
  normalize,
  select,
  clone,
  hasSubfield
} = require('./utils');

const debug = require('debug')('feature-author245c');

// Checks for the equality of 245c, other cases should be handled by 'author' check.
function author245c(record1, record2) {
  var fields1 = select(['245..c'], clone(record1));
  var fields2 = select(['245..c'], clone(record2));

  var norm245c = ['toSpace("-")', 'delChars("\':,.")', 'trimEnd', 'upper', 'utf8norm', 'removediacs', 'removeEmpty'];
  var normalized1 = normalize(select(['245..c'], clone(record1)), norm245c);
  var normalized2 = normalize(select(['245..c'], clone(record2)), norm245c);

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

    if (!hasSubfield(set1, 'c') || !hasSubfield(set2, 'c')) {
      return null;
    } 

    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    const getValue = (set) => _.get(set, '[0].subfield', []).map(sub => sub._).join(' ');
    //const isSubset = (subset, superset) => _.difference(subset, superset).length === 0;
    const isSubsetWith = (subset, superset, comparator) => _.differenceWith(subset, superset, comparator).length === 0;
    //const isIdentical = (set1, set2) => isSubset(set1, set2) && isSubset(set2, set1);
    const startsWithComparator = (wordA, wordB) =>  wordA.startsWith(wordB) || wordB.startsWith(wordA);
    const generateAbbrevations = (str) => str.split(' ').map((word, index, arr) => {
      const abbreviation = word.substr(0,1);
      return _.concat(arr.slice(0,index), abbreviation, arr.slice(index+1) ).join(' ');
    });

    const name1 = getValue(set1);
    const name2 = getValue(set2);
    
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    
    const abbrevations1 = generateAbbrevations(name1);
    const abbrevations2 = generateAbbrevations(name2);

    const comparisons = _.concat(
      abbrevations1.map(abbr => [abbr, name2]),
      abbrevations2.map(abbr => [abbr, name1])
    );

    if (comparisons.some(([name1, name2]) => name1 === name2)) {
      return Labels.SURE;
    }

	
    if (compareFuncs.isIdentical(set1, set2, compareFuncs.lvComparator(0.80))) {
      debug('isIdentical lvComparator.80');
      return Labels.SURE;
    }

    if (compareFuncs.isIdentical(set1, set2, compareFuncs.jaccardComparator(0.66))) {
      debug('isIdentical jaccardComparator0.66');
      return Labels.ALMOST_SURE;
    }

    if (compareFuncs.isIdentical(set1, set2, compareFuncs.lvComparator(0.75))) {
      debug('isIdentical lvComparator.75');
      return Labels.ALMOST_SURE;
    }
    
    
    
    if (isSubsetWith(words1, words2, startsWithComparator) || isSubsetWith(words2, words1, startsWithComparator)) {
      return Labels.ALMOST_SURE;
    }

    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };
}

module.exports = author245c;