// @flow
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
const {Labels} = require('./constants');

const {
  fromXMLjsFormat,
  selectValue,
  normalizeWith,
  normalizeText,
  expandAlias,
  isSubset,
  selectValues,
  selectPublicationYear
} = require('./utils');

const publisher = require('./feature-publisher');
const ISBN = require('./feature-ISBN');

function isBookClub(publisherName) {
  return publisherName.includes('KIRJAKERHO');
}
const select008value = record => _.head(record.fields.filter(field => field.tag === '008').map(f => f.value));
const selectLanguage = f008 => _.isString(f008) ? f008.substr(35, 3) : f008;

function stopConditions(xmlJsrecord1, xmlJsrecord2) {
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);

  const isbnMatch = ISBN(xmlJsrecord1, xmlJsrecord2).check();
  const publisherMatch = publisher(xmlJsrecord1, xmlJsrecord2).check();
  const nameOfPublisher = _.flow(selectValue('260', 'b'), normalizeWith(normalizeText, expandAlias));
  const publicationPlace = _.flow(selectValue('260', 'a'), normalizeWith(normalizeText, expandAlias));

  const language041 = _.flow(selectValues('041', 'a'), normalizeWith(arr => arr.map(normalizeText)));
  const language008 = _.flow(select008value, selectLanguage, normalizeText);

  const languageConsistent = record => language041(record).includes(language008(record));

  const names = ['isbn-publisher', 'isbn-bookclub', 'languages-different', 'publisher-year-reprint', 'publication-place-old-records'];

  function check() {
    const isbnMismatch = isbnMatch === Labels.SURELY_NOT;
    const publisherMismatch = publisherMatch.slice(0, 3)
      .filter(val => val !== null)
      .some(label => label === Labels.SURELY_NOT);

    const isbnAndPublisher = isbnMismatch && publisherMismatch;

    const publisherA = nameOfPublisher(record1);
    const publisherB = nameOfPublisher(record2);

    const bothAreBookClubs = isBookClub(publisherA) && isBookClub(publisherB);
    const isbnAndBookClub = (isBookClub(publisherA) || isBookClub(publisherB) && !bothAreBookClubs);

    const languagesAreSame = isSubset(language041(record1), language041(record2)) || isSubset(language041(record2), language041(record1));
    const languages = (languageConsistent(record1) && languageConsistent(record2) && !languagesAreSame);

    const publisherNameMismatch = publisherA !== publisherB;
    const yearMismatch = selectPublicationYear(record1) !== selectPublicationYear(record2);
    const has250 = record => record.fields.filter(field => field.tag === '250').length > 0;

    const publisherYearReprint = publisherNameMismatch && yearMismatch && !has250(record1) && !has250(record2);

    const substringComparator = (a, b) => a.includes(b) || b.includes(a);
    const publicationPlaceMismatch = !substringComparator(publicationPlace(record1), publicationPlace(record2));
    const publicationPlaceMismatchForOldRecords = !yearMismatch && selectPublicationYear(record1) < 1972 && publicationPlaceMismatch;

    return [isbnAndPublisher, isbnAndBookClub, languages, publisherYearReprint, publicationPlaceMismatchForOldRecords].map(val => val ? Labels.ABSOLUTELY_NOT_DOUBLE : null);
  }

  return {
    check,
    names
  };
}

module.exports = stopConditions;
