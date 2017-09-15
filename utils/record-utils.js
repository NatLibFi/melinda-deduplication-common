
import type { MarcRecord, Field, DataField, ControlField } from 'types/marc-record.flow';

const moment = require('moment');
const _ = require('lodash');
const debug = require('debug')('marc-record-utils');
const toArabic = require('roman-numerals').toArabic;

type PageInfo = {
  start: number,
  end: number,
  str: string,
  total: number
};

function parsePageInfo(inputString: string): ?PageInfo {
  if (!inputString) return null;

  const charactersToRemove = '[]';
  const charactersToSpaces = ',';
  // char -> char -> char -> boolean
  const characterBetween = (startChar, endChar) => {
    let insideParenthesis = false;
    return (char) => {
      if (char == startChar) {
        insideParenthesis = true;
        return false;
      } else if (char == endChar) {
        insideParenthesis = false;
        return false;
      } else {
        return !insideParenthesis;
      }
    };
  };

  const normalizedString = inputString.split('')
    .filter(char => !_.includes(charactersToRemove, char))
    .map(char => _.includes(charactersToSpaces, char) ? ' ' : char)
    .filter(characterBetween('(',')'))
    .join('');

  const unableToParse = normalizedString.split(' ').some(word => isNotAllowed(word.toLowerCase()));

  if (unableToParse) {
    return null;
  }

  // Match range ex. 123-534
  const rangeMatch = /(\d+)-(\d+)/.exec(normalizedString);
  
  if (rangeMatch != null) {
    
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);

    return {
      start: start,
      end: end,
      str: inputString,
      total: end-start
    };
  }

  const numbers = normalizedString
    .replace(/\D/g,' ')
    .replace(/\s+/g,' ')
    .split(' ')
    .map(n => parseInt(n, 10));
  
  const max_num = _.max(numbers);
  
  let preambleSize = parsePreambleSize(normalizedString);
  
  const start = 0;
  const end = max_num;
  return {
    start: start,
    end: end,
    str: inputString,
    total: end - start + preambleSize
  };

  // string -> number
  function parsePreambleSize(str: string): number {
    let preambleSize = 0;
    str.split(' ').some(function(word) {
      try {
        preambleSize = toArabic(word);
        return true;
      } catch(e) {
        return false;
      }
    });
    return preambleSize;
  }

  // string -> bool
  function isNotAllowed(word: string): boolean {

    const charsToRemove = ':.()[],-'.split('');

    const normalizedWord = word.split('')
      .filter(char => !_.includes(charsToRemove, char))
      .join('');

    const allowedPattern = /^[x|v|i|s|p|\d]*$/;

    return !allowedPattern.test(normalizedWord);
  }
}

// str -> [string]
function parseYears(str: string): Array<string> {
  if (!str) return [];

  // keeps only words that are 4 characters long and between 1000 and 2100 (exclusive)
  return str.split(/\D/).filter(isYear).sort();

  function isYear(str) {
    if (str.length != 4) return false;
    if (isNaN(str)) return false;
    var number = parseInt(str, 10);

    return number < 2100 && number > 1000;
  }
}

function fieldToString(field: Field): string {
  if (field && field.subfields) {
    return dataFieldToString(field);
  } else {
    return controlfieldToString(field);
  }

  function dataFieldToString(field: DataField): string {
    const ind1 = field.ind1 || ' ';
    const ind2 = field.ind2 || ' ';
    const subfields = field.subfields.map(subfield => `‡${subfield.code}${subfield.value}`).join('');
    return `${field.tag} ${ind1}${ind2} ${subfields}`;
  }

  function controlfieldToString(field: ControlField): string {
    return `${field.tag}    ${field.value}`;
  }
}

function stringToField(fieldStr: string): Field {
  const tag = fieldStr.substr(0,3);
  if (parseInt(tag) < 10) {
    const value = fieldStr.substr(7);
    return { tag, value };
  }
  const ind1 = fieldStr.substr(4,1);
  const ind2 = fieldStr.substr(5,1);
  const subfieldsStr = fieldStr.substr(6);
  
  const subfields = _.tail(subfieldsStr.split('‡')).map(subfieldStr => ({
    code: subfieldStr.substr(0,1),
    value: subfieldStr.substr(1)
  }));

  return { tag, ind1, ind2, subfields };
}

function selectRecordId(record: MarcRecord): boolean {
  return _.get(record.fields.find(field => field.tag === '001'), 'value');
}

function isDeleted(record: MarcRecord): boolean {
  return record.leader.substr(5,1) === 'd';
}

function parseParentId(record: MarcRecord): string {
  return _.chain(record.fields)
    .filter(field => field.tag === '773')
    .flatMap(field => field.subfields)
    .filter(subfield => subfield.code === 'w')
    .map('value')
    .head()
    .value();
}

function isComponentRecord(record: MarcRecord): boolean {
  const parentId = parseParentId(record);
  return parentId !== undefined;
}

function getLastModificationDate(record: MarcRecord): Date {
  const timestamp005 = _.get(record.fields.find(field => field.tag === '005'), 'value');

  if (timestamp005) {
    return moment(timestamp005, 'YYYYMMDDHHmmss.S').toDate();
  }

  debug('Could not parse timestamp from record', record.toString());
  return new Date(0);
}


module.exports = { 
  parsePageInfo,
  parseYears,
  fieldToString,
  stringToField,
  selectRecordId,
  isDeleted,
  parseParentId,
  isComponentRecord,
  getLastModificationDate
};
