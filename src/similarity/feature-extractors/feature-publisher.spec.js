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

const {SURE, SURELY_NOT, ALMOST_SURE} = Labels;

const {MarcRecord} = require('@natlibfi/marc-record');
const Utils = require('./utils');

const publisher = require('./feature-publisher');

describe('feature-publisher', () => {
  let record1;
  let record2;

  beforeEach(() => {
    record1 = new MarcRecord();
    record2 = new MarcRecord();
  });

  function primeRecords(strForRec1, strForRec2) {
    record1.appendField(Utils.stringToField(strForRec1));
    record2.appendField(Utils.stringToField(strForRec2));
  }

  function runExtractor() {
    const extractor = publisher(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    return extractor.check();
  }

  it('it should return null for missing data', () => {
    expect(runExtractor()).to.eql([null, null, null, null, null, null]);
  });

  it('it should return SURE for identcal items', () => {
    primeRecords(
      '260    ‡aOxford :‡bOxford University Press,‡c2002.',
      '260    ‡aOxford :‡bOxford University Press,‡c2002.'
    );
    expect(runExtractor()).to.eql([SURE, SURE, SURE, null, null, null]);
  });

  it('it should return SURELY_NOT for dissimilar items', () => {
    primeRecords(
      '260    ‡aNew York :‡bOxford University Press,‡c2002.',
      '260    ‡aOxford :‡bOxford University Press,‡c2002.'
    );
    expect(runExtractor()).to.eql([SURELY_NOT, SURE, SURE, null, null, null]);
  });

  it('it should use aliases for common abbreviations etc', () => {
    primeRecords(
      '260    ‡aHelsinki :‡b[Valtion painatuskeskus],‡c1985.',
      '260    ‡aHki :‡bValtion painatuskeskus,‡c1985.'
    );
    expect(runExtractor()).to.eql([SURE, SURE, SURE, null, null, null]);
  });

  it('it should return ALMOST_SURE for similar items', () => {
    primeRecords(
      '260    ‡aHelsinki :‡b[Valtion painXXtuskeskus],‡c1985.',
      '260    ‡aHki :‡bValtion painatuskeskus,‡c1985.'
    );
    expect(runExtractor()).to.eql([SURE, ALMOST_SURE, SURE, null, null, null]);
  });

  it('it should return SURE for similar c-subfields with extra characters', () => {
    primeRecords(
      '260    ‡aHelsinki :‡b[Valtion painatuskeskus],‡ccop. 1985.',
      '260    ‡aHki :‡bValtion painatuskeskus,‡c1985.'
    );
    expect(runExtractor()).to.eql([SURE, SURE, SURE, null, null, null]);
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
