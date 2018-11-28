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
const compareFuncs = require('./core.compare');

const {
  fromXMLjsFormat,
  selectValue,
  normalizeWith,
  isDefined,
  empty,
  expandAlias,
  normalizeText,
  selectNumbers
} = require('./utils');

function publisher(xmlJsrecord1, xmlJsrecord2) {
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);

  const placeOfPublication = _.flow(selectValue('260', 'a'), normalizeWith(normalizeText, expandAlias));
  const nameOfPublisher = _.flow(selectValue('260', 'b'), normalizeWith(normalizeText, expandAlias));
  const dateOfPublication = _.flow(selectValue('260', 'c'), normalizeWith(normalizeText, expandAlias, selectNumbers));
  const placeOfManufacture = _.flow(selectValue('260', 'e'), normalizeWith(normalizeText, expandAlias));
  const manufacturer = _.flow(selectValue('260', 'f'), normalizeWith(normalizeText, expandAlias));
  const dateOfManufacture = _.flow(selectValue('260', 'g'), normalizeWith(normalizeText, expandAlias, selectNumbers));

  const extractorNames = ['placeOfPublication', 'nameOfPublisher', 'dateOfPublication', 'placeOfManufacture', 'manufacturer', 'dateOfManufacture'];
  const extractors = [placeOfPublication, nameOfPublisher, dateOfPublication, placeOfManufacture, manufacturer, dateOfManufacture];

  function check() {
    const valuesA = extractors.map(extract => extract(record1));
    const valuesB = extractors.map(extract => extract(record2));

    return _.zip(valuesA, valuesB).map(([a, b], i) => {
      const isDateField = i === 2 || i === 5;

      if (!isDefined(a, b) || empty(a, b)) {
        return null;
      }

      // No edit-distance checks for date fields.
      if (isDateField) {
        return _.isEqual(a, b) ? Labels.SURE : Labels.SURELY_NOT;
      }

      if (a === b) {
        return Labels.SURE;
      }

      const almostSame = compareFuncs.lvComparator(0.80);

      if (almostSame(a, b)) {
        return Labels.ALMOST_SURE;
      }

      return Labels.SURELY_NOT;
    });
  }

  return {
    check,
    names: extractorNames
  };
}

module.exports = publisher;
