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
const stopWordData = require('../../default-configs/f245ab-stop-words');
const normalizeFuncs = require('./core.normalize');
const compareFuncs = require('./core.compare');

const STOP_WORD_FREQUENCY = 12000;
const stopWords = stopWordData.split('\n')
  .filter(line => line.length > 1)
  .map(line => line.split(' '))
  .filter(pair => parseInt(_.head(pair)) > STOP_WORD_FREQUENCY)
  .map(pair => _.last(pair))
  .reduce((lookup, word) => _.set(lookup, word, true), {});

const {
  normalize,
  select,
  clone,
  hasSubfield,
  startsOrEndsComparatorWith,
  normalizeText
} = require('./utils');

const {Labels} = require('./constants');

function title(record1, record2) {
  let fields1 = select(['245..ab'], clone(record1));
  let fields2 = select(['245..ab'], clone(record2));

  const field1AB = select(['245..ab'], clone(record1));
  const field2AB = select(['245..ab'], clone(record2));

  const field1P = select(['245..p'], clone(record1));
  const field2P = select(['245..p'], clone(record2));

  const f246a1 = select(['246..a'], record1);
  const f246a2 = select(['246..a'], record2);

  let f245pn1 = select(['245..pn'], record1);
  let f245pn2 = select(['245..pn'], record2);

  let normalized1 = normalize(clone(fields1), ['utf8norm', 'removediacs']);
  let normalized2 = normalize(clone(fields2), ['utf8norm', 'removediacs']);

  if (fields1[0] === undefined || fields2[0] === undefined) {
    return {check: () => null};
  }

  fields1[0].subfield = fields1[0].subfield.concat(clone(f245pn1[0]).subfield);
  fields2[0].subfield = fields2[0].subfield.concat(clone(f245pn2[0]).subfield);

  f245pn1.forEach(collapseIdenticalNumbersFromSubfield('n'));
  f245pn2.forEach(collapseIdenticalNumbersFromSubfield('n'));

  f245pn1 = normalize(f245pn1, ['toSpace("[],=:-()/")', wordMap, 'toSpace(".")', 'romanToArabic']);
  f245pn2 = normalize(f245pn2, ['toSpace("[],=:-()/")', wordMap, 'toSpace(".")', 'romanToArabic']);

  f245pn1.forEach(abbrSubfield('n'));
  f245pn2.forEach(abbrSubfield('n'));

  fields1 = fields1.concat(f246a1);
  fields2 = fields2.concat(f246a2);

  normalized1.forEach(parseTitles);
  normalized2.forEach(parseTitles);

  normalized1.forEach(toFieldFragments);
  normalized2.forEach(toFieldFragments);

  normalized1 = normalized1.concat(normalize(clone(f246a1), ['utf8norm', 'removediacs']));
  normalized2 = normalized2.concat(normalize(clone(f246a2), ['utf8norm', 'removediacs']));

  const normalized_f245pn1 = normalize(clone(f245pn1), ['utf8norm', 'removediacs']);
  const normalized_f245pn2 = normalize(clone(f245pn2), ['utf8norm', 'removediacs']);

  normalized1[0].subfield = normalized1[0].subfield.concat(normalized_f245pn1[0].subfield);
  normalized2[0].subfield = normalized2[0].subfield.concat(normalized_f245pn2[0].subfield);

  normalized1 = normalize(clone(normalized1), ['toSpace("-()[]!?<>*%½+¡®")', 'delChars("\'/,.:\\"")', 'trim', 'upper', 'collapse']);
  normalized2 = normalize(clone(normalized2), ['toSpace("-()[]!?<>*%½+¡®")', 'delChars("\'/,.:\\"")', 'trim', 'upper', 'collapse']);

  const removeStopWords = field => {
    field.subfield = field.subfield.map(subfield => {
      if (subfield.$.code === 'X') {
        const withoutStopWords = subfield._.split(' ').filter(word => !stopWords[word]).join(' ');

        if (withoutStopWords.length > 0) {
          subfield._ = withoutStopWords;
        }
      }
      return subfield;
    });
    return field;
  };

  const mergeSubfields = code => field => {
    const newSubValue = field.subfield.filter(sub => sub.$.code === code).map(sub => sub._).join(' ');
    field.subfield = field.subfield.filter(sub => sub.$.code !== code);
    field.subfield.push({
      $: {code},
      _: newSubValue
    });
    return field;
  };

  const handleStopWords = _.flow(mergeSubfields('X'), removeStopWords);

  normalized1 = normalized1.map(handleStopWords);
  normalized2 = normalized2.map(handleStopWords);

  return {
    check,
    getData
  };

  function check() {
    // Check function will mutate sets, so make a clone.
    const set1 = clone(normalized1);
    const set2 = clone(normalized2);

    // If both are missing, we skip the step.
    if (set1.length === set2.length === 0) {
      return null;
    }

    // If other is missing, then we skip the step
    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    if (hasSubfield(set1, 'n') || hasSubfield(set2, 'n')) {
      let rec1n = get(set1, '245', 'n').join();
      let rec2n = get(set2, '245', 'n').join();

      rec1n = withoutYears(rec1n);
      rec2n = withoutYears(rec2n);

      const numbers1 = rec1n.split('').filter(isNumber).join();
      const numbers2 = rec2n.split('').filter(isNumber).join();

      if (numbers1 !== numbers2) {
        return Labels.ABSOLUTELY_NOT_DOUBLE;
      }
    }
    // Necessary checks for n-subfield has been done, remove it from poisoning the rest of checks,
    // since it is hard to normalize because of it's many formats.
    set1.forEach(removeSubfields('n'));
    set2.forEach(removeSubfields('n'));

    if (!hasSubfield(set1, 'X') || !hasSubfield(set2, 'X')) {
      return null;
    }

    // Stopwords were removed from titles, if there nothing left then skip the check
    const fieldContent = (fields, code) => _.flatMap(fields, field => field.subfield).filter(sub => sub.$.code === code).map(subfield => subfield._).join(' ');

    const content1 = fieldContent(set1, 'X');
    const content2 = fieldContent(set2, 'X');

    if (fieldContent(set1, 'X').length < 2 || fieldContent(set2, 'X').length < 2) {
      return null;
    }

    const pickNumbers = str => str.replace(/\D/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
    const set1NumbersInSubfieldA = pickNumbers(normalizeFuncs.romanToArabicConversion(get(field1AB, '245', 'a').join()));
    const set2NumbersInSubfieldA = pickNumbers(normalizeFuncs.romanToArabicConversion(get(field2AB, '245', 'a').join()));
    const set1NumbersInSubfieldB = pickNumbers(normalizeFuncs.romanToArabicConversion(get(field1AB, '245', 'b').join()));
    const set2NumbersInSubfieldB = pickNumbers(normalizeFuncs.romanToArabicConversion(get(field2AB, '245', 'b').join()));

    const identical = (a, b) => _.difference(a, b).length === 0 && _.difference(b, a).length === 0;

    const set1Numbers = _.concat(set1NumbersInSubfieldA, set1NumbersInSubfieldB);
    const set2Numbers = _.concat(set2NumbersInSubfieldA, set2NumbersInSubfieldB);

    if (!identical(set1Numbers, set2Numbers)) {
      return Labels.ABSOLUTELY_NOT_DOUBLE;
    }

    const select245pValue = _.flow(_.partialRight(get, '245', 'p'), _.head, normalizeText);

    const p1 = select245pValue(field1P);
    const p2 = select245pValue(field2P);

    if (p1 && p2 && (!p1.includes(p2) && !p2.includes(p1))) {
      return Labels.ABSOLUTELY_NOT_DOUBLE;
    }

    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    if (startsOrEndsComparatorWith(content1, content2, compareFuncs.lvComparator(0.85))) {
      return Labels.SURE;
    }

    if (compareFuncs.isIdentical(set1, set2, compareFuncs.lvComparator(0.85))) {
      return Labels.ALMOST_SURE;
    }

    // If one set has strings that are contained is the set of other strings
    if (compareFuncs.isIdentical(set1, set2, compareFuncs.stringPartofComparatorRatio(0.75))) {
      return Labels.ALMOST_SURE;
    }

    if (compareFuncs.isIdentical(concatSameSubfields(set1), concatSameSubfields(set2), compareFuncs.lvComparator(0.85))) {
      return Labels.ALMOST_SURE;
    }

    if (compareFuncs.isSubset(set1, set2) || compareFuncs.isSubset(set2, set1)) {
      const subs1 = set1.reduce((memo, field) => {
        memo = memo.concat(field.subfield); return memo;
      }, []);
      const subs2 = set2.reduce((memo, field) => {
        memo = memo.concat(field.subfield); return memo;
      }, []);

      const ratio = Math.min(subs1.length, subs2.length) / Math.max(subs1.length, subs2.length);

      if (ratio >= 0.5) {
        return 0.5;
      }
    }

    // If one set has strings that are contained in the set of other strings
    if (compareFuncs.isIdentical(set1, set2, compareFuncs.stringPartofComparator)) {
      return 0.3;
    }

    return Labels.ABSOLUTELY_NOT_DOUBLE;
  }

  // Merges multiple subfields with same code to a single subfield
  function concatSameSubfields(set) {
    return set.map(field => {
      const groups = _.chain(field.subfield).groupBy('$.code').value();
      const mergedSubfields = Object.keys(groups).map(code => {
        const subs = groups[code];
        const val = _.map(subs, '_').join(' ');
        return {_: val, $: {code}};
      });
      field.subfield = mergedSubfields;
      return field;
    });
  }

  // Removes words that are 4 characters long and between 1000 and 2100 (exclusive)
  function withoutYears(str) {
    str = str.split(' ').filter(str => {
      return !isYear(str);
    }).join(' ');
    return str;
  }
  function isYear(str) {
    if (str.length != 4) {
      return false;
    }
    if (isNaN(str)) {
      return false;
    }
    const number = parseInt(str, 10);

    return number < 2100 && number > 1000;
  }

  function removeSubfields(subCode) {
    return function (field) {
      field.subfield = field.subfield.filter(subfield => {
        return (subfield.$.code !== subCode);
      });
    };
  }

  function isNumber(char) {
    if (char === '' || char === ' ') {
      return false;
    }
    return !isNaN(char);
  }

  function get(set, tag, subCode) {
    const contents = [];
    set.forEach(field => {
      if (field.$.tag == tag) {
        field.subfield.forEach(subfield => {
          if (subfield.$.code === subCode) {
            contents.push(subfield._);
          }
        });
      }
    });
    return contents;
  }

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function toFieldFragments(field) {
    const newSubfields = field.subfield.map(subfield => {
      const parts = subfield._.split(':');
      return parts.map(part => {
        return {
          _: part.trim(),
          $: {code: 'X'}
        };
      });
    });

    field.subfield = _.flatten(newSubfields);
  }

  function parseTitles(field) {
    const str1 = _(field.subfield).reduce((memo, subfield) => {
      return memo + subfield._ + ' ';
    }, '');

    field.subfield = str1.split('=').map(subfieldContent => {
      return {
        _: subfieldContent.trim(),
        $: {code: 'X'}
      };
    });
  }
  function abbrSubfield(subCode) {
    return function (field) {
      field.subfield.forEach(subfield => {
        if (subfield.$.code == subCode) {
          subfield._ = subfield._.split(' ').map(abbr).sort().join(' ');
        }
      });
    };
    function abbr(str) {
      if (isNaN(str[0])) {
        return str[0];
      }
      return str;
    }
  }
}

function wordMap(fields) {
  normalizeFuncs.applyToFieldValues(fields, content => {
    return content.split(' ').map(translate).join(' ');
  }, {});

  return fields;
  function translate(word) {
    return map245n(word);
  }
}

// This will turn this:
//  Osa 6 = Del 6 = Part 6
// into this:
//  Osa = Del = Part 6
function collapseIdenticalNumbersFromSubfield(code) {
  return function (field) {
    field.subfield.forEach(subfield => {
      if (subfield.$.code == code) {
        const subfieldParts = subfield._.split('=');
        const numbers = subfieldParts.map(part => {
          return part.replace(/\D/g, '');
        });
        const texts = subfieldParts.map(part => {
          return part.replace(/[^\D]/g, '').replace(/\s+/, ' ');
        });

        subfield._ = texts.join('=') + _.uniq(numbers).join(' ');
      }
    });
  };
}

const map245n_data = {
  one: 1,
  two: 2,
  second: 2,
  three: 3,
  fourth: 4,
  fifth: 5,

  ensimmäinen: 1,
  toinen: 2,
  kolmas: 3,
  neljäs: 4,
  viides: 5,
  kuudes: 6,
  seitsemäs: 7,

  första: 1,
  andra: 2,
  tredje: 3,
  fjärde: 4,
  femte: 5,
  'd.': 'Del', // D is 500 in roman numbers so expand it to prevent conversion to 500

  erster: 1
};

function map245n(word) {
  return map245n_data[word.toLowerCase()] || word;
}

module.exports = title;
