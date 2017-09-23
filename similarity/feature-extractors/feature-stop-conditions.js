const _ = require('lodash');
const { Labels } = require('./constants');

const {
  fromXMLjsFormat
} = require('./utils');

const publisher = require('./feature-publisher');
const ISBN = require('./feature-ISBN');

function stopConditions(xmlJsrecord1, xmlJsrecord2) {
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);
  

  const isbnMatch = ISBN(xmlJsrecord1, xmlJsrecord2).check();
  const publisherMatch = publisher(xmlJsrecord1, xmlJsrecord2).check();

  function check() {

    const isbnMismatch = isbnMatch === Labels.SURELY_NOT;
    const publisherMismatch = publisherMatch.slice(0,3)
      .filter(val => val !== null)
      .some(label => label === Labels.SURELY_NOT);


    if (isbnMismatch && publisherMismatch) {

      return Labels.ABSOLUTELY_NOT_DOUBLE;  
    }
    return null;
  }

  return {
    check: check,
  };

}

module.exports = stopConditions;