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
const extractors = require('./extractors');
const normalizers = require('./normalizers');

function defaultNotARobotFilter(name) {
  return !['LOAD', 'CARE', 'CONV', 'LINK', 'KVPBATCH'].some(robotName => name.includes(robotName));
}

const ExtractorPreset = {
  Default: [
    {fenniOrNotLDR: [extractors.fenniOrNotLDR, normalizers.lexical]},
    {publicationYear: [extractors.publicationYear, normalizers.lexical]},
    {fenniOrNotFrom008: [extractors.fenniOrNotFrom008, normalizers.lexical]},
    {nonFinnishHELKA: [extractors.nonFinnishHELKA, normalizers.identity]},
    {FENNI: [extractors.specificLocalOwner('FENNI'), normalizers.identity]},
    {VIOLA: [extractors.specificLocalOwner('VIOLA'), normalizers.identity]},
    {TAISTO_ONLY: [extractors.specificSingleLocalOwner('TAISTO'), normalizers.identity]},
    {VAARI_ONLY: [extractors.specificSingleLocalOwner('VAARI'), normalizers.identity]},
    {ANDER_ONLY: [extractors.specificSingleLocalOwner('ANDER'), normalizers.identity]},
    {recordAge: [extractors.recordAge, normalizers.moreRecent(5, 2)]},
    {reprintInfo: [extractors.reprintInfo, normalizers.reprint]},
    {localOwnerCount: [extractors.localOwnerCount, normalizers.lexical]},
    {FINL: [extractors.specificFieldValue('040', ['a', 'd'], ['FI-NL']), normalizers.identity]},
    {RDA: [extractors.specificFieldValue('040', ['e'], ['RDA', 'rda']), normalizers.identity]},
    {f245c: [extractors.specificField('245', ['c']), normalizers.identity]},
    {latestChange: [extractors.latestChange(defaultNotARobotFilter), normalizers.moreRecent(5, 2)]},
    {field008nonEmptyCount: [extractors.field008nonEmptyCount, normalizers.proportion]},
    {f100d: [extractors.specificField('100', ['d']), normalizers.identity]},
    {f100e: [extractors.specificField('100', ['e']), normalizers.identity]},
    {f130a: [extractors.specificField('130', ['a']), normalizers.identity]},
    {f240subs: [extractors.subfieldCount('240'), normalizers.lexical]},
    {f245subs: [extractors.subfieldCount('245'), normalizers.lexical]},
    {f250subs: [extractors.subfieldCount('250'), normalizers.lexical]},
    {f300subs: [extractors.subfieldCount('300'), normalizers.lexical]},
    {f260subs: [extractors.subfieldCount('260'), normalizers.lexical]},
    {f264subs: [extractors.subfieldCount('264'), normalizers.lexical]},
    {has007: [extractors.fieldCount('007'), normalizers.lexical]},
    {f020q: [extractors.specificField('020', ['q']), normalizers.identity]},
    {f260e_or_f: [extractors.specificField('260', ['e', 'f']), normalizers.identity]},
    {f084subs: [extractors.subfieldCount('084'), normalizers.lexical]},
    {f080subs: [extractors.subfieldCount('080'), normalizers.lexical]},
    {f041subs: [extractors.subfieldCount('041'), normalizers.lexical]},
    {f830x: [extractors.specificField('830', ['x']), normalizers.identity]},
    {f830subs: [extractors.subfieldCount('830'), normalizers.lexical]},
    {f338count: [extractors.fieldCount('338'), normalizers.lexical]},
    {uppercase: [extractors.uppercaseSubfield, normalizers.identity]},
    {unknownPublisher: [extractors.containsValue(['260', '264'], ['tuntematon']), normalizers.identity]}
  ]
};

function normalizeFeatureVectors(vector1, vector2, extractorSet) {
  const normalizers = extractorSet.map(extractor => _.head(_.values(extractor))).map(val => val[1]);

  const vector1copy = vector1.slice();
  const vector2copy = vector2.slice();

  normalizers.forEach((normalizerFunc, index) => {
    if (typeof normalizerFunc !== 'function') {
      throw new TypeError(`normalizer '${normalizerFunc}' is not a function`);
    }

    vector1[index] = normalizerFunc(vector1copy[index], vector2copy[index]);
    vector2[index] = normalizerFunc(vector2copy[index], vector1copy[index]);
  });
}

function generateFeatures(record, extractorSet) {
  return _.flatMap(extractorSet, extractor => {
    return Object.keys(extractor).map(key => {
      return {
        name: key,
        value: extractor[key][0](record)
      };
    });
  });
}

function generateFeatureVector(features) {
  return features.map(feature => feature.value);
}

module.exports = {
  normalizeFeatureVectors,
  generateFeatures,
  generateFeatureVector,
  ExtractorPreset
};
