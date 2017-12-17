/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Shared modules for microservices of Melinda deduplication system
 *
 * Copyright (c) 2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-deduplication-common
 *
 * melinda-deduplication-common is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * melinda-deduplication-common is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 **/

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
