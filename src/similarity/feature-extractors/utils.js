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
const MarcRecord = require('marc-record-js');
const compareFuncs = require('./core.compare');
const filterFuncs = require('./core.filter');
const normalizeFuncs = require('./core.normalize'); //eslint-disable-line

function normalize(param, normalizerArray, options) {
  options = options || {};
  return _.reduce(normalizerArray, singleNormalize(options), param);
}

function singleNormalize(options) {
  return function (param, normalizer) {
    if (_.isFunction(normalizer)) {
      return normalizer.call(this, param, options);
    }
    if (_.isString(normalizer)) {
      const func = eval(`normalizeFuncs.${normalizer}`);
      return func.call(this, param, options);
    }
  };
}

function compare(comparator, param1, param2) {
  if (_.isFunction(comparator)) {
    return comparator.call(this, param1, param2);
  }
  if (_.isString(comparator)) {
    return compareFuncs[comparator].call(this, param1, param2);
  }
}

function select(selectors, record) {
  const selections = _.flattenDeep(_.map(selectors, filter(record)));

  return selections;
}

function filter(record) {
  return function (selector) {
    if (_.isFunction(selector)) {
      return selector.call(this, record);
    }

    if (_.isString(selector)) {
      try {
        const func = eval(selector);

        return func.call(null, selector, record);
      } catch (e) {
        return filterFuncs.stringSelector(selector, record);
      }
    }
  };
}

function clone(a) {
  return JSON.parse(JSON.stringify(a));
}

function hasSubfield(set, codes) {
  const codeList = codes.split('');

  let has = false;
  set.forEach(field => {
    field.subfield.forEach(sub => {
      if (codeList.indexOf(sub.$.code) !== -1) {
        has = true;
      }
    });
  });
  return has;
}

function getSubfield(field, code) {
  const subfields = getSubfields(field, code);
  if (subfields.length > 1) {
    throw new Error('Record has multiple subfields of code: ' + code);
  }
  return subfields[0];
}

function getSubfields(field, code) {
  const subfields = field.subfield.filter(subfield => {
    return subfield.$.code == code;
  });
  return _.map(subfields, '_');
}

function fieldToString(field) {
  if (field && field.subfields) {
    const ind1 = field.ind1 || ' ';
    const ind2 = field.ind2 || ' ';
    const subfields = field.subfields.map(subfield => `‡${subfield.code}${subfield.value}`).join('');
    return `${field.tag} ${ind1}${ind2} ${subfields}`;
  }
  return `${field.tag}    ${field.value}`;
}

function stringToField(fieldStr) {
  const tag = fieldStr.substr(0, 3);
  if (parseInt(tag) < 10) {
    const value = fieldStr.substr(7);
    return {tag, value};
  }
  const ind1 = fieldStr.substr(4, 1);
  const ind2 = fieldStr.substr(5, 1);
  const subfieldsStr = fieldStr.substr(6);

  const subfields = _.tail(subfieldsStr.split('‡')).map(subfieldStr => ({
    code: subfieldStr.substr(0, 1),
    value: subfieldStr.substr(1)
  }));

  return {tag, ind1, ind2, subfields};
}

function generateField(tag, subcode, content) {
  const field = {
    $: {
      tag
    },
    subfield: []
  };

  if (_.isArray(content)) {
    content.forEach(addSubfield);
  } else {
    addSubfield(content);
  }

  return field;

  function addSubfield(content) {
    field.subfield.push({
      $: {code: subcode},
      _: content
    });
  }
}

function createField(tag, subcode) {
  return function (fieldContent) {
    return generateField(tag, subcode, fieldContent);
  };
}

function removeSubfields(func) {
  return function (field) {
    field.subfield = field.subfield.filter(subfield => {
      return !func(subfield);
    });
  };
}

function convertToISBN13(isbn) {
  if (isbn === undefined || isbn.length !== 10) {
    return isbn;
  }
  return addISBN13CheckDigit('978' + isbn.substring(0, 9));
}

function addISBN13CheckDigit(isbn) {
  if (isbn.length != 12) {
    throw new Error('ISBN13CheckDigit can only handle ISBN13 (without check digit)');
  }

  const sum = isbn.split('').reduce((memo, val, i) => {
    const num = parseInt(val, 10);

    if (i % 2 == 0) {
      memo += num;
    } else {
      memo += num * 3;
    }

    return memo;
  }, 0);

  let checkDigit = 10 - (sum % 10);

  if (checkDigit == 10) {
    checkDigit = 0;
  }
  isbn += checkDigit;

  return isbn;
}

function dateOfPublication(record) {
  let fields1 = select(['260..c'], record);

  if (fields1.length == 0) {
    const rec1_008 = _(record.controlfield).find(f => {
      return f.$.tag == '008';
    });

    if (rec1_008 === undefined) {
      throw new Error('Field 008 missing from record.');
    }

    const fields_from_008_1 = [rec1_008._.substr(7, 4), rec1_008._.substr(11, 4)].map(createField('008', 'a'));

    fields1 = fields1.concat(fields_from_008_1);
  }

  const normalized1 = normalize(fields1, ['onlyYearNumbers', 'removeEmpty']);

  let set1 = normalized1;

  set1 = set1.map(field => {
    return _.map(field.subfield, '_');
  });
  set1 = _.chain(set1).flattenDeep().uniq().value();

  if (set1.length === 0) {
    return 9999;
  }

  return _.max(set1);
}

function subCode(subcode) {
  return function (subfield) {
    return (subfield.$.code == subcode);
  };
}

function actOnPublicationDate(year, action) {
  return function (record, fields, normalized) {
    if (dateOfPublication(record) < year) {
      normalized.forEach(action);
      fields.push(generateField(999, 'a', dateOfPublication(record)));
    }
  };
}

function getFields(set, selector) {
  const tag = selector.substr(0, 3);
  const subcode = selector.substr(3, 1);

  const fields = set.filter(field => {
    return field.$.tag == tag;
  });

  const retFields = clone(fields);
  retFields.forEach(field => {
    const subfields = field.subfield.filter(subfield => {
      return subfield.$.code == subcode;
    });

    field.subfield = subfields;
  });
  return retFields;
}

function getField(set, selector) {
  const tag = selector.substr(0, 3);
  const subcode = selector.substr(3, 1);

  const fields = set.filter(field => {
    return field.$.tag == tag;
  });

  if (fields.length > 1) {

    //    Console.log('\nWarning: has multiple ' + selector + ':');

  }
  if (fields.length === 0) {
    return undefined;
  }
  const ret = clone(fields[0]);

  ret.subfield = ret.subfield.filter(subfield => {
    return subfield.$.code == subcode;
  });

  if (ret.subfield.length > 1) {
    throw new Error('field has multiple subfields of ' + selector);
  }
  if (ret.subfield.length === 0) {
    return undefined;
  }
  return ret.subfield[0]._;
}

function parseISBN(fields) {
  fields.forEach(field => {
    const subfields = [];

    field.subfield.forEach(subfield => {
      let matches;

      matches = /(\d{13})/.exec(subfield._);
      if (matches !== null) {
        subfield._ = matches[1];
        subfields.push(subfield);
        return;
      }

      matches = /([0-9X]{10})/.exec(subfield._);
      if (matches !== null) {
        subfield._ = convertToISBN13(matches[1]);
        subfields.push(subfield);
      }
    });
    field.subfield = subfields;
  });

  return fields;
}

function toxmljsFormat(marcRecord) {
  const xmljsFormat = {
    leader: marcRecord.leader,
    controlfield: marcRecord.getControlfields().map(controlfieldFormatter),
    datafield: marcRecord.getDatafields().map(datafieldFormatter)
  };

  return xmljsFormat;

  function controlfieldFormatter(field) {
    return {
      $: {
        tag: field.tag
      },
      _: field.value
    };
  }
  function datafieldFormatter(field) {
    return {
      $: {
        tag: field.tag,
        ind1: field.ind1,
        ind2: field.ind2
      },
      subfield: field.subfields.map(subfieldFormatter)
    };
  }

  function subfieldFormatter(subfield) {
    return {
      $: {
        code: subfield.code
      },
      _: subfield.value
    };
  }
}

function fromXMLjsFormat(xmljsRecord) {
  const controlFields = xmljsRecord.controlfield.map(f => ({tag: f.$.tag, value: f._}));
  const dataFields = xmljsRecord.datafield.map(f => {
    const tag = f.$.tag;
    const ind1 = f.$.ind1;
    const ind2 = f.$.ind2;
    const subfields = f.subfield.map(subfield => ({code: subfield.$.code, value: subfield._}));
    return {tag, ind1, ind2, subfields};
  });

  const data = {
    leader: xmljsRecord.leader,
    fields: _.concat(controlFields, dataFields)
  };
  return MarcRecord.clone(data);
}

function extractFormat(record) {
  const l6 = record.leader.substr(6, 1);
  const l7 = record.leader.substr(7, 1);

  const isBK = (l6, l7) => ['a', 't'].includes(l6) && !['b', 'i', 's'].includes(l7);
  const isCR = (l6, l7) => ['a', 't'].includes(l6) && ['b', 'i', 's'].includes(l7);
  const isMP = l6 => ['e', 'f'].includes(l6);
  const isMU = l6 => ['c', 'd', 'i', 'j'].includes(l6);
  const isCF = l6 => l6 === 'm';
  const isMX = l6 => l6 === 'p';
  const isVM = l6 => ['g', 'k', 'o', 'r'].includes(l6);

  switch (true) {
    case isBK(l6, l7): return 'BK';
    case isCR(l6, l7): return 'CR';
    case isMP(l6): return 'MP';
    case isMU(l6): return 'MU';
    case isCF(l6): return 'CF';
    case isMX(l6): return 'MX';
    case isVM(l6): return 'VM';
  }
}

const getValue = set => _.get(set, '[0].subfield', []).map(sub => sub._).join(' ');
const isSubset = (subset, superset) => _.difference(subset, superset).length === 0;
const isSubsetWith = (subset, superset, comparator) => _.differenceWith(subset, superset, comparator).length === 0;
const isIdentical = (set1, set2) => isSubset(set1, set2) && isSubset(set2, set1);
const generateAbbrevations = str => str.split(' ').map((word, index, arr) => {
  const abbreviation = word.substr(0, 1);
  return _.concat(arr.slice(0, index), abbreviation, arr.slice(index + 1)).join(' ');
});

const selectValues = (tag, code) => record => {
  return _.chain(record.fields)
    .filter(field => field.tag === tag)
    .flatMap(field => field.subfields)
    .filter(sub => sub.code === code)
    .map(sub => sub.value)
    .value();
};

const selectValue = (tag, code) => record => selectValues(tag, code)(record).join(' ');

const normalizeWith = (...normalizers) => value => {
  return normalizers.reduce((currentValue, nextNormalizer) => nextNormalizer(currentValue), value);
};

const isDefined = (...vals) => vals.every(val => val !== null && val !== undefined);
const empty = (...vals) => vals.some(val => val.length === 0);

// NOTE: these are normalized forms:
const ALIASES = {
  HKI: 'HELSINKI',
  HELSINGISS: 'HELSINKI',
  HELSINGFORS: 'HELSINKI',
  HFORS: 'HELSINKI'
};

const characterMap = {
  ä: 'a',
  ö: 'o',
  å: 'a'
};

const skandit = word => word.split('').map(c => _.get(characterMap, c.toLowerCase(), c)).join('');

const expandAlias = sentence => _.isString(sentence) ? sentence.split(' ').map(word => _.get(ALIASES, word, word)).join(' ') : sentence;
const normalizeText = str => _.isString(str) ? skandit(str).replace(/\W/g, ' ').replace(/\s+/g, ' ').toUpperCase().trim() : str;
const dropNumbers = str => _.isString(str) ? str.replace(/\d/g, ' ').replace(/\s+/g, ' ') : str;

const isValid = val => !(_.isNull(val) || _.isUndefined(val) || val.length === 0);

const startsWithComparator = (a, b) => a.startsWith(b) || b.startsWith(a);
const endsWithComparator = (a, b) => a.endsWith(b) || b.endsWith(a);
const startsOrEndsComparator = (a, b) => startsWithComparator(a, b) || endsWithComparator(a, b);

const startsOrEndsComparatorWith = (a, b, equalityFunction = _.isEqual) => {
  const [shorter, longer] = [a, b].sort((a, b) => a.length - b.length);
  const longerStart = longer.substring(0, shorter.length);
  const longerEnd = longer.substring(-shorter.length);

  return equalityFunction(shorter, longerStart) || equalityFunction(shorter, longerEnd);
};

const selectNumbers = sentence => {
  return _.chain(sentence).split(' ')
    .flatMap(word => word.replace(/\D/g, ' ').split(' '))
    .filter(word => !isNaN(word) && word.length > 0)
    .map(num => parseInt(num))
    .value();
};

function selectPublicationYear(record) {
  const from260c = selectValue('260', 'c');

  const from008 = record.fields
    .filter(field => field.tag === '008')
    .map(field => field.value)
    .map(value => value.substr(7, 4));

  const normalizedYears = _.flatMap([from260c, from008], normalizeWith(selectNumbers));

  if (normalizedYears.length === 0) {
    return 9999;
  }
  return _.max(normalizedYears);
}

// Fields -> subfields (with tag)
const flattenFields = fields => _.flatMap(fields, field => {
  if (field.subfields) {
    return field.subfields.map(sub => Object.assign({}, sub, {tag: field.tag}));
  }
  return field;
});

// Const selectYears = (sentence) => _.isString(sentence) ? sentence.split(/\D/).filter(isYear).join(' ') : sentence;

// keeps only words that are 4 characters long and between 1000 and 2100 (exclusive)
function isYear(param) {
  let number;
  if (_.isString(param)) {
    if (param.length != 4) {
      return false;
    }
    if (isNaN(param)) {
      return false;
    }
    number = parseInt(param, 10);
  } else {
    number = param;
  }

  return number < 2100 && number > 1000;
}

const forMissingFeature = (labelIfEitherIsMissingFeature, comparator) => (itemA, itemB) => {
  const containsData = item => {
    const isNotEmpty = (_.isString(item) || _.isArray(item)) ? item.length > 0 : true;

    return item !== null && item !== undefined && isNotEmpty;
  };

  if (containsData(itemA) && containsData(itemB)) {
    return comparator(itemA, itemB);
  }
  if (containsData(itemA) || containsData(itemB)) {
    return labelIfEitherIsMissingFeature;
  }
  return null;
};

module.exports = {
  normalize,
  singleNormalize,
  select,
  clone,
  filter,
  compare,
  hasSubfield,
  getSubfield,
  getSubfields,
  fieldToString,
  stringToField,
  toxmljsFormat,
  generateField,
  createField,
  removeSubfields,
  convertToISBN13,
  subCode,
  actOnPublicationDate,
  getFields,
  getField,
  parseISBN,
  fromXMLjsFormat,
  extractFormat,
  getValue,
  isSubset,
  isSubsetWith,
  isIdentical,
  startsWithComparator,
  generateAbbrevations,
  selectValues,
  selectValue,
  normalizeWith,
  isDefined,
  empty,
  ALIASES,
  expandAlias,
  normalizeText,
  isValid,
  startsOrEndsComparator,
  endsWithComparator,
  startsOrEndsComparatorWith,
  selectNumbers,
  selectPublicationYear,
  flattenFields,
  dropNumbers,
  isYear,
  forMissingFeature
};
