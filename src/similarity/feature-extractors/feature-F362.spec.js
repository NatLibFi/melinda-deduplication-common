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

const chai = require('chai');

const expect = chai.expect;

const {Labels} = require('./constants');

const {SURE, SURELY_NOT, ABSOLUTELY_NOT_DOUBLE} = Labels;

const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const createExtractor = require('./feature-F362');

describe('feature-F362', () => {
  let record1;
  let record2;

  beforeEach(() => {
    record1 = new MarcRecord();
    record2 = new MarcRecord();
  });

  function primeRecords(strForRec1, strForRec2) {
    strForRec1 && record1.appendField(Utils.stringToField(strForRec1));
    strForRec2 && record2.appendField(Utils.stringToField(strForRec2));
  }

  function runExtractor() {
    const extractor = createExtractor(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    return extractor.check();
  }

  it('should return null if records are missing 362', () => {
    expect(runExtractor()).to.eql([null, null]);
  });

  it('should return null if either record is missing 362', () => {
    record1.appendField(Utils.stringToField('362 0  ‡a1999-', '362 0  ‡a1999, [1]-'));
    expect(runExtractor()).to.eql([null, null]);
  });

  describe('for records that contain same years and numbers', () => {
    const tests = [
      ['362 0  ‡a1999-', '362 0  ‡a1999, [1]-'],

      ['362 0  ‡a1930, n:o 1-1931, n:o 9-10 b.', '362 0  ‡a1930, 1-1931, 9-10 b'],
      ['362 0  ‡a[19]92, 1-', '362 0  ‡a[19]92, 1-'],
      ['362 0  ‡a2013, 1-', '362 0  ‡a2013, 1-'],
      ['362 0  ‡a2002, 1-', '362 0  ‡a2002, 1-'],
      ['362 0  ‡a1933-', '362 0  ‡a1933-'],
      ['362 0  ‡aMars-april 2000-', '362 0  ‡aMars-april 2000-'],
      ['362 0  ‡a1999, 1.', '362 0  ‡a1999, no 1-'],
      ['362 0  ‡a[19]96, 1-', '362 0  ‡a[19]96, 1-'],
      ['362 0  ‡a2003, 1-', '362 0  ‡a2003, 1-'],
      ['362 0  ‡a1. vsk., n:o 1(1971)-', '362 0  ‡a1. vsk., n:o 1(1971)-'],
      ['362 0  ‡a1927, 1-1960, 52.', '362 0  ‡a1927, 1-1960, 52.'],
      ['362 0  ‡a2003, 1-', '362 0  ‡a2003, [1]-'],
      ['362 0  ‡a2007, joulukuu-', '362 0  ‡aJoulukuu, 2007-'],
      ['362 0  ‡a[19]90, 1-', '362 0  ‡a[19]90, 1-'],
      ['362 0  ‡aUusi sarja vol. 1 (1903)-', '362 0  ‡aUusi sarja vol. 1 (1903)-'],
      ['362 0  ‡a1. årg., nr 1(1995)-', '362 0  ‡a1. årg., nr 1(1995)-'],
      ['362 0  ‡a2013, 1-', '362 0  ‡a2013, 1-'],
      ['362 0  ‡a1930, 1-1931, 9-10 b', '362 0  ‡a1930, 1-1931, 9-10 b.'],
      ['362 0  ‡a2005-', '362 0  ‡a2005-'],
      ['362 0  ‡a2003, 1-', '362 0  ‡a2003, 1-'],
      ['362 0  ‡a1992, 1(No 1-)', '362 0  ‡a1992, 1-'],
      ['362 0  ‡a[19]90, 1-', '362 0  ‡a[19]90, 1-'],
      ['362 0  ‡a1996, 1-', '362 0  ‡a1996, 1-'],
      ['362 0  ‡a1936, 1-1939, 6.', '362 0  ‡a1936, 1-1939, 6.'],
      ['362 0  ‡a[19]90, 1-[20]02, 4.', '362 0  ‡a[19]90, 1-[20]02, 4.'],
      ['362 0  ‡a1933-', '362 0  ‡a1933-'],
      ['362 0  ‡a1926, 1-6.', '362 0  ‡a1926, 1-1926, 6.'],
      ['362 0  ‡a1897, 0-1904, 8.', '362 0  ‡a1897, 0-1904, 8.'],
      ['362 0  ‡a2000, 1-', '362 0  ‡a2000-']
    ];

    tests.forEach(test => {
      it('should return SURE', () => {
        primeRecords(test[0], test[1]);
        expect(runExtractor()).to.eql([SURE, SURE], `${test[0]} - ${test[1]}`);
      });
    });
  });

  describe('for records that contain same years but different numbers', () => {
    const tests = [
      ['362 0  ‡a1907, näyten:o ; 1907, n:o 1-1931, n:o 6.', '362 0  ‡a1907, näyten:o-1931, 6'],
      ['362 0  ‡a1. vsk (1925), n:o 1- 15. vsk (1939), n:o 6.', '362 0  ‡a1925, 1-1939, 6.']
    ];

    tests.forEach(test => {
      it('should return SURE for years', () => {
        primeRecords(test[0], test[1]);
        expect(runExtractor()[0]).to.eql(SURE, `${test[0]} - ${test[1]}`);
      });
      it('should return ABSOLUTELY_NOT_DOUBLE for numbers', () => {
        primeRecords(test[0], test[1]);
        expect(runExtractor()[1]).to.eql(ABSOLUTELY_NOT_DOUBLE, `${test[0]} - ${test[1]}`);
      });
    });
  });

  describe('for records that contain different years and numbers', () => {
    const tests = [
      ['362 0  ‡a1 (1965)-15 (1979) ; 1980-', '362 0  ‡a1(1965)-']
    ];
    tests.forEach(test => {
      it('should return SURELY_NOT for years and ABSOLUTELY_NOT_DOUBLE for numbers', () => {
        primeRecords(test[0], test[1]);
        expect(runExtractor()).to.eql([SURELY_NOT, ABSOLUTELY_NOT_DOUBLE], `${test[0]} - ${test[1]}`);
      });
    });
  });
});

function toWeirdFormat(record) {
  return {
    controlfield: record.getControlfields().map(convertControlField),
    datafield: record.getDatafields().map(convertDataField)
  };

  function convertControlField(field) {
    return {
      $: {
        tag: field.tag
      },
      _: field.value
    };
  }
  function convertDataField(field) {
    return {
      $: {
        tag: field.tag,
        ind1: field.ind1,
        ind2: field.ind2
      },
      subfield: field.subfields.map(convertSubfield)
    };

    function convertSubfield(subfield) {
      return {
        $: {
          code: subfield.code
        },
        _: subfield.value
      };
    }
  }
}
