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
// Feature extractors for determining preference

/*
  Encoding level
  This has some special cases, since other organizations use 4 and others 5 for same meaning,
  whereas 5 may be better because it's done by fennica or something.
  Points given:
  #: 4
  u,z: 0
  1,2,4: 3
  5,7: 2
  3,8: 1
  0
  returns [0,n]
*/

function encodingLevel(record) {
  if (record.leader === undefined || record.leader.length < 17) {
    return undefined;
  }

  const encodingLevel = record.leader.charAt(17);
  if (encodingLevel === '^') {
    return 4;
  }

  if (['u', 'z'].indexOf(encodingLevel) !== -1) {
    return 0;
  }

  if (['1', '2', '4'].indexOf(encodingLevel) !== -1) {
    return 3;
  }

  if (['5', '7'].indexOf(encodingLevel) !== -1) {
    return 2;
  }

  if (['3', '8'].indexOf(encodingLevel) !== -1) {
    return 1;
  }
  return 0;
}

function fenniOrNotLDR(record) {
  if (record.leader === undefined || record.leader.length < 17) {
    return undefined;
  }

  const encodingLevel = record.leader.charAt(17);
  if (encodingLevel === '8') {
    return -1;
  }
  return encodingLevel === '^' ? 1 : 0;
}

function publicationYear(record) {
  const extractFunc = controlfieldPosition('008', 7, 4);
  return extractFunc(record);
}

/*
  008 Cataloging source (index 39)
  ranking:
  kansallisbibliografia>yhteisö>muu>tuntematon>eikoodattu.
  Points awared:
  # = 4
  c = 3
  d = 2
  u = 1
  | = 0
  returns [0,1,2,3,4]
*/
function catalogingSourceFrom008(record) {
  const extractFunc = controlfieldPosition('008', 39);
  const value = extractFunc(record);
  switch (value) {
    case '^': return 4;
    case 'c': return 3;
    case 'd': return 2;
    case 'u': return 1;
    case '|': return 0;
  }
  return 0;
}

function fenniOrNotFrom008(record) {
  const extractFunc = controlfieldPosition('008', 39);
  const value = extractFunc(record);
  return value === '^' ? 1 : 0;
}

/*

*/
function nonFinnishHELKA(record) {
  const extractFunc = controlfieldPosition('008', 35, 3);
  const language = extractFunc(record);

  if (language.toLowerCase() !== 'fin') {
    const hasHELKA = specificLocalOwner('HELKA');
    if (hasHELKA(record)) {
      return 1;
    }
  }
  return 0;
}

// Returns 1 if the record has only given localowner tag
function specificSingleLocalOwner(localOwnerTag) {
  return function (record) {
    const localOwnerFields = localOwnerList(record);
    if (localOwnerFields.length == 1 &&
      localOwnerFields[0] == localOwnerTag.toUpperCase()) {
      return 1;
    }
    return 0;
  };
}

/*
  Field 008 chars 00-05, record age, newer is preferred.
*/
function recordAge(record) {
  const extractFunc = controlfieldPosition('008', 0, 6);
  return extractFunc(record);
}

function reprintInfo(record) {
  const year = publicationYear(record);
  let notesOnReprints = record.fields
    .filter(tagFilter('500'))
    .map(field => {
      return field.subfields
        .filter(sub => sub.code === 'a')
        .map(sub => sub.value)
        .filter(value => /^Lisäp/i.test(value));
    });

  notesOnReprints = Array.prototype.concat.apply([], notesOnReprints);

  return {
    year,
    notesOnReprints
  };
}

/*
  Local owner count
  returns [0,n]
*/
function localOwnerCount(record) {
  return localOwnerList(record).length;
}

/**
 * Returns an integer representing how many times the field with given tag is in the record.
 * If arrayOfsubfields is given, then returns the number of such subfields in the record.
 */

function fieldCount(tag, arrayOfSubfields) {
  return function (record) {
    const fieldsWithTag = record.fields.filter(field => field.tag === tag);

    if (arrayOfSubfields === undefined) {
      return fieldsWithTag.length;
    }
    const subfieldsWithTagAndCode = _.chain(fieldsWithTag)
      .flatMap(field => field.subfields)
      .filter(sub => arrayOfSubfields.includes(sub.code))
      .value();

    return subfieldsWithTagAndCode.length;
  };
}

function subfieldCount(tag) {
  return function (record) {
    const fieldsWithTag = record.fields.filter(field => field.tag === tag);
    return _.flatMap(fieldsWithTag, field => field.subfields).length;
  };
}

function uppercaseSubfield(record) {
  const relevantFields = ['245', '260', '300', '500', '600', '700', '710', '100'];

  const relevantField = field => relevantFields.includes(field.tag);
  const irrelevantCodes = ['0', '5', '9'];

  const hasUppercaseSubfield = _.chain(record.fields)
    .filter(relevantField)
    .flatMap(field => field.subfields.map(sub => _.set(sub, 'tag', field.tag)))
    .filter(subfield => !irrelevantCodes.includes(subfield.code))
    .map('value')
    .filter(value => value.length > 8)
    .filter(value => /[a-zA-Z]/.test(value))
    .some(value => value.toUpperCase() === value)
    .value();

  return hasUppercaseSubfield ? 1 : 0;
}

/*
  Extract specific field value from record
  Example usecases:
  Field 040 has in it's subfield [a,d] value: FI-NL
  -> specificFieldValue('040', ['a', 'd'], ['FI-NL']);

  returns [0,1]
*/

function specificFieldValue(tag, arrayOfSubfields, lookupValues) {
  return function (record) {
    return _.chain(record.fields)
      .filter(field => field.tag === tag)
      .flatMap(field => field.subfields)
      .filter(subfield => arrayOfSubfields.includes(subfield.code))
      .some(subfield => lookupValues.includes(subfield.value))
      .value() ? 1 : 0;
  };
}

function specificField(tag, subfieldList) {
  return function (record) {
    return _.chain(record.fields)
      .filter(field => field.tag === tag)
      .flatMap(field => field.subfields)
      .some(subfield => subfieldList.includes(subfield.code))
      .value() ? 1 : 0;
  };
}

/*
  Extract field length from record
  If the record has multiple fields with given tag, returns sum of each fields lengths.
  returns [0,n]
*/
function fieldLength(tag) {
  return function (record) {
    return _.chain(record.fields)
      .filter(field => field.tag === tag)
      .flatMap(field => field.subfields)
      .map(subfield => subfield.value.length)
      .sum()
      .value();
  };
}

function specificLocalOwner(localOwnerTag) {
  const lowExtractor = specificFieldValue('LOW', ['a'], localOwnerTag.toUpperCase());
  const sidExtractor = specificFieldValue('SID', ['b'], localOwnerTag.toLowerCase());

  return function (record) {
    return lowExtractor(record) || sidExtractor(record);
  };
}

/*
  Latest-change: From CAT with user-filter-function, defaults to 005 if there are no CAT fields.
  returns timestamp in format YYYYMMDDHHmm
*/

function latestChange(nameFilterFunction) {
  if (nameFilterFunction === undefined) {
    nameFilterFunction = () => true;
  }

  return function (record) {
    const changeLog = record.fields.filter(tagFilter('CAT')).map(field => {
      const sub_a = _.head(field.subfields.filter(codeFilter('a')));
      const sub_c = _.head(field.subfields.filter(codeFilter('c')));
      const sub_h = _.head(field.subfields.filter(codeFilter('h')));

      return {
        user: _.get(sub_a, 'value'),
        date: _.get(sub_c, 'value', '0000'),
        time: _.get(sub_h, 'value', '0000')
      };
    });

    const humanChangeLog = changeLog.filter(changeEntry => {
      if (changeEntry.user === undefined) {
        return false;
      }
      return nameFilterFunction(changeEntry.user);
    });

    // Sort in descending order by date
    humanChangeLog.sort((b, a) => {
      const dateDiff = parseIntegerProperty(a, 'date') - parseIntegerProperty(b, 'date');
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return parseIntegerProperty(a, 'time') - parseIntegerProperty(b, 'time');
    });

    if (humanChangeLog.length > 0) {
      return humanChangeLog[0].date + humanChangeLog[0].time;
    }
    // Default to field 005
    const f005 = _.head(record.fields.filter(tagFilter('005')));
    const value = _.get(f005, 'value', '0');
    return value.substr(0, 12);
  };
}

function parseIntegerProperty(obj, propName) {
  return (obj[propName] !== undefined) ? parseInt(obj[propName], 10) : 0;
}

function field008nonEmptyCount(record) {
  const value = _.get(record.fields.find(f => f.tag === '008'), 'value');
  if (value === undefined) {
    return 0;
  }
  return value.split('')
    .filter(c => c !== '|')
    .filter(c => c !== '^')
    .length;
}

/** Utility functions */

/**
 * extracts count characters from index in first controlfield with tag
 *
 */

function controlfieldPosition(tag, index, count) {
  count = count || 1;
  return function (record) {
    const field = _.head(record.fields.filter(tagFilter(tag)));
    if (field === undefined) {
      let returnValue = '';
      for (let i = 0; i < count; i++) {
        returnValue += '|';
      }
      return returnValue;
    }
    if (field.value.length < index) {
      return undefined;
    }
    return field.value.substr(index, count);
  };
}

function containsValue(tags, values) {
  return function (record) {
    return _.chain(record.fields)
      .filter(field => tags.includes(field.tag))
      .flatMap(field => field.subfields)
      .some(subfield => values.some(lookupValue => subfield.value.includes(lookupValue)))
      .value() ? 1 : 0;
  };
}

function localOwnerList(record) {
  const localOwnerFields = record.fields.filter(field => {
    return field.tag === 'LOW' || field.tag === 'SID';
  });

  let localOwnerOrganizations = localOwnerFields.map(field => {
    if (field.tag === 'LOW') {
      const a_subfields = field.subfields.filter(f => {
        return f.code === 'a';
      });

      if (a_subfields.length) {
        return a_subfields[0].value;
      }
    }

    if (field.tag === 'SID') {
      const b_subfields = field.subfields.filter(f => {
        return f.code === 'b';
      });
      if (b_subfields.length) {
        return b_subfields[0].value;
      }
    }
    return undefined;
  });

  localOwnerOrganizations = localOwnerOrganizations.reduce((memo, item) => {
    if (item !== undefined && item !== null) {
      memo.push(item);
    }
    return memo;
  }, []);

  localOwnerOrganizations = localOwnerOrganizations.map(str => {
    return str.toUpperCase();
  });

  return _.uniq(localOwnerOrganizations);
}

function codeFilter(code) {
  return subfield => subfield.code === code;
}

function tagFilter(tag) {
  return field => field.tag === tag;
}

module.exports = {
  catalogingSourceFrom008,
  encodingLevel,
  fieldCount,
  latestChange,
  localOwnerCount,
  nonFinnishHELKA,
  publicationYear,
  recordAge,
  reprintInfo,
  specificFieldValue,
  specificSingleLocalOwner,
  fieldLength,
  specificLocalOwner,
  specificField,
  field008nonEmptyCount,
  fenniOrNotLDR,
  fenniOrNotFrom008,
  subfieldCount,
  uppercaseSubfield,
  containsValue
};
