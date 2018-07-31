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

const {SURE, SURELY_NOT, ABSOLUTELY_NOT_DOUBLE} = Labels;

const {
  fromXMLjsFormat,
  selectValue,
  normalizeWith,
  normalizeText,
  expandAlias,
  forMissingFeature,
  isSubset
} = require('./utils');

const instrumentationTerms = `
alttoviulu
basso
harmonikka
kitaran sointuote
kitaran sointuotteet
kosketinsoitin
lapsi
lapsiäänet
lapsikuoro
laulu
lauluääni
melodia
mies
mieskuoro
nais
naiskuoro
piano
sanat
sekakuoro
sello
sointumerkit
urut
vihuela
viulu
`.split('\n').filter(_.identity).map(normalizeText);

const thesisTerms = `
Lisensiaat
Pro gradu
Lic
Ekon avh
Opinnäyte
Päättötyö
Lopputyö
Diplomityö
thesis
kand
Diss
väitösk
`.split('\n').filter(_.identity).map(normalizeText);

const sentenceToWords = sentence => _.isString(sentence) ? sentence.split(' ') : sentence;
const pick = terms => list => _.isArray(list) ? list.filter(str => terms.includes(str)) : list;

const bothInclude = terms => (valuesA = [], valuesB = []) => {
  const listsHaveIdenticalItem = (comparator, list1, list2) => list1.some(value1 => list2.some(value2 => comparator(value1, value2)));
  const substringComparator = (a, b) => a.includes(b) || b.includes(a);

  const listContainsTerm = _.partial(listsHaveIdenticalItem, substringComparator, terms);

  const aIncluded = listContainsTerm(valuesA);
  const bIncluded = listContainsTerm(valuesB);

  const both = aIncluded && bIncluded;
  const either = aIncluded || bIncluded;
  const neither = !either;

  return both || neither;
};

function TermsInFields(xmlJsrecord1, xmlJsrecord2) {
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);

  const featureNames = ['instrumentation-terms-500a', 'thesis'];

  // Selectors
  const instrumentationTerms500A = _.flow(selectValue('500', 'a'), normalizeWith(normalizeText, expandAlias, sentenceToWords, pick(instrumentationTerms)));

  const progradu = _.flow(selectValue('509', 'a'), normalizeWith(normalizeText, expandAlias));
  const dissertation = _.flow(selectValue('502', 'a'), normalizeWith(normalizeText, expandAlias));
  const thesis = record => _.concat(progradu(record), dissertation(record)).filter(item => item.length > 0);

  const selectors = [instrumentationTerms500A, thesis];

  // Comparators
  const toLabel = (t, f) => val => val === null ? null : val ? t : f;

  const comparators = [
    _.flow(forMissingFeature(null, isSubset), toLabel(SURE, SURELY_NOT)),
    _.flow(bothInclude(thesisTerms), toLabel(SURE, ABSOLUTELY_NOT_DOUBLE))
  ];

  function check() {
    const features = _.zip(selectors, comparators).map(([select, compare]) => {
      const valueA = select(record1);
      const valueB = select(record2);

      return compare(valueA, valueB);
    });
    return features;
  }

  return {
    check,
    names: featureNames.map(name => `Terms-${name}`)
  };
}

module.exports = TermsInFields;

