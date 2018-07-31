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

import _ from 'lodash';

const wuzzy = require('wuzzy');

const RecordUtils = require('../utils/record-utils');

/*
B fail: Both records have same record id
B fail: Record is deleted (source)
B fail: Record is deleted (target)
B fail: Record is suppressed (source)
B fail: Record is suppressed (target)
B fail: Both records have have LOW tag: <LOW-TAG>
B fail: Records are of different type (leader/6): <RECORD-A-LDR6> - <RECORD-B-LDR6>
H fail: record is a component record: <RECORD-ID>

B warn: Record contains long field which has been split to multiple fields. Check that it looks ok. <TAG>
B warn: Other record has LOW: FENNI, but preferred does not.

*/

const defaultPreset = [recordsHaveDifferentIds, preferredRecordIsNotDeleted, otherRecordIsNotDeleted, preferredRecordIsNotSuppressed, otherRecordIsNotSuppressed, recordsHaveSameType, recordsHaveDifferentLOWTags];

// Checks that need to pass in order for the records to be automatically merged
// by the deduplication system
const autoMergeExtraChecks = [
  recordsHaveSimilarAuthors,
  recordsHaveSimilarNumberOfPages,
  recordsHaveSimilarNumbersInTitle,
  recordsHaveSameCountriesAndYears,
  recordsHaveSaneReprintHistory,
  recordsHaveNotBeenSplitted
];

export const preset = {
  defaults: defaultPreset,
  melinda_host: _.concat(defaultPreset, [preferredRecordIsNotComponentRecord, otherRecordIsNotComponentRecord]),
  melinda_component: _.concat(defaultPreset),
  melinda_warnings: [preferredRecordFromFENNI, preferredRecordHasAlephSplitFields, otherRecordHasAlephSplitFields],
  melinda_host_automerge: _.concat(defaultPreset, autoMergeExtraChecks, [preferredRecordIsNotComponentRecord, otherRecordIsNotComponentRecord])
};

export function validateMergeCandidates(validationFunctions, preferredRecord, otherRecord) {
  const validationResults = validationFunctions.map(fn => fn(preferredRecord, otherRecord));

  return Promise.all(validationResults).then(results => {
    const failures = results.filter(result => result.valid === false);

    if (failures.length > 0) {
      const failureMessages = failures.map(failure => failure.validationFailureMessage);
      throw new MergeValidationError('Merge validation failed', failureMessages);
    }

    return {
      valid: true
    };
  });
}

export function recordsHaveDifferentIds(preferredRecord, otherRecord) {
  return {
    valid: getRecordId(preferredRecord) !== getRecordId(otherRecord),
    validationFailureMessage: 'Both records have the same record id'
  };
}

export function recordsHaveDifferentLOWTags(preferredRecord, otherRecord) {
  const preferredRecordLibraryTagList = getLibraryTagList(preferredRecord);
  const otherRecordLibraryTagList = getLibraryTagList(otherRecord);

  const libraryTagsInBoth = _.intersection(preferredRecordLibraryTagList, otherRecordLibraryTagList);

  return {
    valid: libraryTagsInBoth.length === 0,
    validationFailureMessage: `Both records have have LOW tags ${libraryTagsInBoth.join(', ')}`
  };
}

export function recordsHaveSameType(preferredRecord, otherRecord) {
  const preferredRecordType = preferredRecord.leader.substr(6, 1);
  const otherRecordType = otherRecord.leader.substr(6, 1);

  return {
    valid: preferredRecordType === otherRecordType,
    validationFailureMessage: `Records are of different type (leader/6): ${preferredRecordType} - ${otherRecordType}`
  };
}

export function preferredRecordIsNotDeleted(preferredRecord) {
  return {
    valid: isDeleted(preferredRecord) === false,
    validationFailureMessage: 'Preferred record is deleted'
  };
}

export function otherRecordIsNotDeleted(preferredRecord, otherRecord) {
  return {
    valid: isDeleted(otherRecord) === false,
    validationFailureMessage: 'Other record is deleted'
  };
}

export function preferredRecordIsNotSuppressed(preferredRecord) {
  return {
    valid: isSuppressed(preferredRecord) === false,
    validationFailureMessage: 'Preferred record is suppressed'
  };
}

export function otherRecordIsNotSuppressed(preferredRecord, otherRecord) {
  return {
    valid: isSuppressed(otherRecord) === false,
    validationFailureMessage: 'Other record is suppressed'
  };
}

export function preferredRecordIsNotComponentRecord(preferredRecord) {
  const recordType = preferredRecord.leader.charAt(7);
  const isComponentRecord = ['a', 'b', 'd'].some(componentRecordType => componentRecordType === recordType);
  return {
    valid: isComponentRecord === false,
    validationFailureMessage: 'Preferred record is a component record'
  };
}

export function otherRecordIsNotComponentRecord(preferredRecord, otherRecord) {
  const recordType = otherRecord.leader.charAt(7);
  const isComponentRecord = ['a', 'b', 'd'].some(componentRecordType => componentRecordType === recordType);
  return {
    valid: isComponentRecord === false,
    validationFailureMessage: 'Other record is a component record'
  };
}

export function preferredRecordFromFENNI(preferredRecord, otherRecord) {
  const preferredRecordLibraryTagList = getLibraryTagList(preferredRecord);
  const otherRecordLibraryTagList = getLibraryTagList(otherRecord);

  const otherHasButPreferredDoesNot = _.includes(otherRecordLibraryTagList, 'FENNI') && !_.includes(preferredRecordLibraryTagList, 'FENNI');

  return {
    valid: otherHasButPreferredDoesNot === false,
    validationFailureMessage: 'The record with FENNI LOW tag should usually be the preferred record'
  };
}

export function preferredRecordHasAlephSplitFields(preferredRecord) {
  const splitFields = preferredRecord.fields.filter(isSplitField);

  const splitFieldTags = _.uniq(splitFields.map(field => field.tag));

  return {
    valid: splitFields.length === 0,
    validationFailureMessage: `The long field ${splitFieldTags.join(', ')} in preferred record has been split to multiple fields. Check that it looks ok.`
  };
}

export function otherRecordHasAlephSplitFields(preferredRecord, otherRecord) {
  const splitFields = otherRecord.fields.filter(isSplitField);

  const splitFieldTags = _.uniq(splitFields.map(field => field.tag));

  return {
    valid: splitFields.length === 0,
    validationFailureMessage: `The long field ${splitFieldTags.join(', ')} in other record has been split to multiple fields. Check that it looks ok.`
  };
}

/*
## recordsHaveSimilarNumberOfPages
002628239 - 005476178 (iso sivumääräero,
*/

// eri sarjat -> käsin ?
/*
## recordsHaveSimilarYears
003726449 - 005930466
ehkä sidottu ja nidottu, eri vuodet ja eri sivumäärät.
*/

/*
  Tags must match, author names must ~match
  Check authorized format of field 100,110,111 and if they don't match then automerge is impossible
  because changing the author must be reported to libraries since it might change the  location of
  the item in the shelves.
*/
export function recordsHaveSimilarAuthors(preferredRecord, otherRecord) {
  const get100A = _.partial(getFieldValue, '100', 'a');
  const get110A = _.partial(getFieldValue, '110', 'a');
  const get111A = _.partial(getFieldValue, '111', 'a');

  const normalize = str => _.isString(str) ? str.replace(/\W/g, ' ').replace(/\s+/g, ' ').toUpperCase().trim() : str;
  const testAuthors = (a, b) => wuzzy.levenshtein(a, b) >= 0.8 && a.substr(0, 3) === b.substr(0, 3);

  const fieldValuePairs = [get100A, get110A, get111A]
    .map(extractFn => ([extractFn(preferredRecord), extractFn(otherRecord)]))
    .filter(pair => (pair[0] || pair[1]))
    .map(pair => pair.map(normalize));

  const authorsMatch = fieldValuePairs.every(pair => (pair[0] && pair[1]) && testAuthors(pair[0], pair[1]));

  return {
    valid: authorsMatch,
    validationFailureMessage: 'Records have different authors'
  };
}

export function recordsHaveNotBeenSplitted(preferredRecord, otherRecord) {
  const get583Notes = record => _.chain(record.fields)
    .filter(field => field.tag === '583')
    .flatMap(field => field.subfields)
    .filter(subfield => subfield.code === 'a')
    .map('value')
    .value();

  const preferredHasBeenSplitted = get583Notes(preferredRecord).some(note => note.includes('SPLIT'));
  const otherRecordHasBeenSplitted = get583Notes(otherRecord).some(note => note.includes('SPLIT'));

  return {
    valid: !preferredHasBeenSplitted && !otherRecordHasBeenSplitted,
    validationFailureMessage: 'Records have been splitted'
  };
}

// Number of pages almost same
export function recordsHaveSimilarNumberOfPages(preferredRecord, otherRecord) {
  const get300A = _.partial(getFieldValue, '300', 'a');
  const lessThan10PercentDifference = (a, b) => Math.abs(1 - (a / b)) < 0.10;
  const lessThan5Difference = (a, b) => Math.abs(a - b) <= 5;

  const recordA300a = get300A(preferredRecord);
  const recordB300a = get300A(otherRecord);

  const pagesInA = RecordUtils.parsePageInfo(recordA300a);
  const pagesInB = RecordUtils.parsePageInfo(recordB300a);

  if (pagesInA === null || pagesInB === null) {
    return {valid: true};
  }

  const valid = lessThan10PercentDifference(pagesInA.total, pagesInB.total) && lessThan5Difference((pagesInA.total), pagesInB.total);

  return {
    valid,
    validationFailureMessage: `Records have different numbers of pages: ${pagesInA.total} vs ${pagesInB.total}`
  };
}

function extractYearsFromRecord(record) {
  const get260C = _.partial(getFieldValue, '260', 'c');
  const extractYearFrom008 = str => str ? str.substr(7, 4) : '';

  const record260c = get260C(record);
  const record008year = extractYearFrom008(getFieldValue('008', record));

  const years = _.chain(RecordUtils.parseYears(record260c))
    .concat(RecordUtils.parseYears(record008year))
    .sort()
    .uniq()
    .value();

  return years;
}

// Same years
export function recordsHaveSimilarYears(preferredRecord, otherRecord) {
  const yearsInA = extractYearsFromRecord(preferredRecord);
  const yearsInB = extractYearsFromRecord(otherRecord);

  return {
    valid: _.isEqual(yearsInA, yearsInB),
    validationFailureMessage: `Records have differing years: ${yearsInA} vs ${yearsInB}`
  };
}

// Esim. 245, toisessa voi olla teokset 1 & 5 ja toisessa 1-7
export function recordsHaveSimilarNumbersInTitle(preferredRecord, otherRecord) {
  const get245A = _.partial(getFieldValue, '245', 'a');

  const recordA245a = get245A(preferredRecord);
  const recordB245a = get245A(otherRecord);

  const numbersInA = extractNumbers(recordA245a);
  const numbersInB = extractNumbers(recordB245a);

  return {
    valid: _.isEqual(numbersInA, numbersInB),
    validationFailureMessage: `Records have different numbers in title: ${numbersInA} vs ${numbersInB}`
  };
}

// Eri maat eri vuodet
export function recordsHaveSameCountriesAndYears(preferredRecord, otherRecord) {
  const get008 = _.partial(getFieldValue, '008');
  const country = f008 => f008 ? f008.substr(15, 3) : 'xx^';

  const yearA = _.head(extractYearsFromRecord(preferredRecord));
  const yearB = _.head(extractYearsFromRecord(otherRecord));
  const countryA = country(get008(preferredRecord));
  const countryB = country(get008(otherRecord));

  if (countryA === 'xx^' || countryB === 'xx^') {
    return {
      valid: true
    };
  }

  const yearCountryA = `${yearA}-${countryA}`;
  const yearCountryB = `${yearB}-${countryB}`;

  return {
    valid: _.isEqual(yearCountryA, yearCountryB),
    validationFailureMessage: `Records have different years+countries: ${yearCountryA} vs ${yearCountryB}`
  };
}

// Tietue A on vanhempi kuin B
// Tietueessa A painostieto 250,
// Tietueessa B ei painostietoa

export function recordsHaveSaneReprintHistory(preferredRecord, otherRecord) {
  const get250A = _.partial(getFieldValue, '250', 'a');

  const yearA = _.head(extractYearsFromRecord(preferredRecord));
  const yearB = _.head(extractYearsFromRecord(otherRecord));

  const reprintA = get250A(preferredRecord) !== null;
  const reprintB = get250A(otherRecord) !== null;

  if (yearA < yearB && reprintA && !reprintB) {
    return {
      valid: false,
      validationFailureMessage: 'Younger record has reprint information'
    };
  }

  if (yearA > yearB && !reprintA && reprintB) {
    return {
      valid: false,
      validationFailureMessage: 'Younger record has reprint information'
    };
  }

  return {
    valid: true
  };
}

function extractNumbers(str) {
  if (!str) {
    return [];
  }
  return str.replace(/\D/g, ' ').split(' ').filter(i => i.length > 0).sort();
}

function getFieldValue(tag, ...rest) {
  if (rest.length == 2) {
    const [code, record] = rest;
    return getDataFieldValue(tag, code, record);
  }
  const [record] = rest;
  return getControlFieldValue(tag, record);

  function getControlFieldValue(tag, record) {
    const field = record.fields.find(field => field.tag === tag);
    return _.get(field, 'value', null);
  }

  function getDataFieldValue(tag, code, record) {
    const field = record.fields.find(field => field.tag === tag);
    if (!field) {
      return null;
    }
    const subfield = field.subfields.find(subfield => subfield.code === code);
    return _.get(subfield, 'value', null);
  }
}

function isSplitField(field) {
  if (field.subfields !== undefined && field.subfields.length > 0) {
    return field.subfields[0].value.substr(0, 2) === '^^';
  }
}

function getLibraryTagList(record) {
  return _.chain(record.fields)
    .filter(field => field.tag === 'LOW')
    .flatMap(field => field.subfields.filter(subfield => subfield.code === 'a'))
    .map('value')
    .value();
}

function isSuppressed(record) {
  return _.chain(record.fields)
    .filter(field => field.tag === 'STA')
    .flatMap(field => field.subfields.filter(subfield => subfield.code === 'a'))
    .some(subfield => subfield.value.toLowerCase() === 'suppressed')
    .value();
}

function isDeleted(record) {
  if (checkLeader()) {
    return true;
  }
  if (checkDELFields()) {
    return true;
  }
  if (checkSTAFields()) {
    return true;
  }

  return false;

  function checkLeader() {
    return record.leader.substr(5, 1) === 'd';
  }

  function checkDELFields() {
    return _.chain(record.fields)
      .filter(field => field.tag === 'DEL')
      .flatMap(field => field.subfields.filter(subfield => subfield.code === 'a'))
      .some(subfield => subfield.value === 'Y')
      .value();
  }

  function checkSTAFields() {
    return _.chain(record.fields)
      .filter(field => field.tag === 'STA')
      .flatMap(field => field.subfields.filter(subfield => subfield.code === 'a'))
      .some(subfield => subfield.value.toLowerCase() === 'deleted')
      .value();
  }
}

function getRecordId(record) {
  const field001ValuesList = record.fields.filter(field => field.tag === '001').map(field => field.value);
  return _.head(field001ValuesList) || 'unknown';
}

export function MergeValidationError(message, failureMessages) {
  const temp = Error.call(this, message);
  temp.name = this.name = 'MergeValidationError';
  this.stack = temp.stack;
  this.message = temp.message;
  this.failureMessages = failureMessages;
}

MergeValidationError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: MergeValidationError,
    writable: true,
    configurable: true
  }
});
