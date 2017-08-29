const _ = require('lodash');
const compareFuncs = require('./core.compare');
const { Labels } = require('./constants');

const {
  normalize,
  select,
  clone,
  getSubfields,
  generateField
} = require('./utils');


function size(record1, record2) {

  var fields1 = select(['300..a'], record1);
  var fields2 = select(['300..a'], record2);

  var norm = ['utf8norm', 'removediacs', 'onlyNumbers', 'removeEmpty'];
  var normalized1 = normalize(clone(fields1), norm);
  var normalized2 = normalize(clone(fields2), norm);

  var aSubcodeExtractor = function(field) {
    return getSubfields(field, 'a');
  };
  //var f1_s = _.flatten(normalized1.map(aSubcodeExtractor)).map(normalizeFuncs.onlyNumbers);
  //var f2_s = _.flatten(normalized2.map(aSubcodeExtractor)).map(normalizeFuncs.onlyNumbers);

  var f1_s = _.flatten(normalized1.map(aSubcodeExtractor));
  var f2_s = _.flatten(normalized2.map(aSubcodeExtractor));


  normalized1 = [];
  normalized2 = [];

  f1_s.forEach(function(item) {
    item.split(' ').forEach(addTo(normalized1));
  });

  f2_s.forEach(function(item) {
    item.split(' ').forEach(addTo(normalized2));
  });

  function addTo(arr) {
    return function(content) {
      if (content !== '') {
        arr.push( generateField(300, 'a', content));
      }
    };
  }

  /*
  f1_s.forEach(function(pageInfo) {
    if (pageInfo != null) {
      var contents = pageInfoToString(pageInfo);
      normalized1.push( generateField(300, 'a', contents) );
    }
  });
  f2_s.forEach(function(pageInfo) {
    if (pageInfo != null) {
      var contents = pageInfoToString(pageInfo);
      normalized2.push( generateField(300, 'a', contents) );
    }
  });

  function pageInfoToString(pageInfo) {
    if (pageInfo.start !== 0) {
      return [
        `RANGE ${pageInfo.start}-${pageInfo.end}`,
        pageInfo.total
      ];
    } else {
      if (pageInfo.total !== pageInfo.end) {
        return [pageInfo.end, pageInfo.total];
      }
      return pageInfo.end;
    }
  }
  */

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

    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    if (compareFuncs.isIdentical(set1, set2, compareFuncs.distanceComparator(5))) {
      return Labels.ALMOST_SURE;
    }

    if (compareFuncs.isSubset(set1, set2, compareFuncs.distanceComparator(3)) ||
      compareFuncs.isSubset(set2, set1, compareFuncs.distanceComparator(3))) {
      return Labels.ALMOST_SURE;
    }

    if (compareFuncs.hasIntersection(set1, set2, compareFuncs.skipSmallerThan(20))) {
      return Labels.MAYBE;
    }

    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };
}

module.exports = size;