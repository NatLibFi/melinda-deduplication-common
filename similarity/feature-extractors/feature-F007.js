var compareFuncs = require('./core.compare');
const { Labels } = require('./constants');

const {
  fromXMLjsFormat
} = require('./utils');

function F007(record1, record2) {

  
  var fields1 = fromXMLjsFormat(record1).fields.filter(f => f.tag === '007');
  var fields2 = fromXMLjsFormat(record2).fields.filter(f => f.tag === '007');
 
  const set1 = fields1;
  const set2 = fields2;
  
  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [set1, set2]
    };
  }

  function check() {

    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    const equalFunc = (a,b) => a.tag === b.tag && a.value === b.value;
    equalFunc.options = {
      noNormalization: true
    };

    if (compareFuncs.isIdentical(set1, set2, equalFunc)) {
      return Labels.SURE;
    }

    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };
}

module.exports = F007;