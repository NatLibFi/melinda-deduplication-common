const _ = require('lodash');

const { Labels } = require('./constants');

const {
  fromXMLjsFormat,
  selectValue,
  normalizeWith,
  normalizeText,
  expandAlias,
  isValid
} = require('./utils');

function bundleNote(xmlJsrecord1, xmlJsrecord2) {
  
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);

  const selectNotes = record => _.concat(selectValue('500', 'a')(record), selectValue('505', 'a')(record)).join(' ');

  const notes = _.flow(selectNotes, normalizeWith(normalizeText, expandAlias));
  
  const notesA = notes(record1);
  const notesB = notes(record2);
  

  function check() {

    if (!isValid(notesA) && !isValid(notesB)) {
      return null;
    }

    if (notesA.includes('SIDO') || notesB.includes('SIDO')) {
      if (notesA === notesB) {
        return Labels.SURE;
      }

      return Labels.ABSOLUTELY_NOT_DOUBLE;
    }

    return null;
  }
    
  return {
    check: check
  };
}

module.exports = bundleNote;
