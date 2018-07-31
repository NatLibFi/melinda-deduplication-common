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

const {SURE, ABSOLUTELY_NOT_DOUBLE} = Labels;

const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const createExtractor = require('./feature-bundle-note');

describe('feature-bundle-note', () => {
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

  it('it should return SURE for identical fields with substring "sido"', () => {
    primeRecords(
      '500    ‡aOsat 1 ja 2 yhteensidotut.',
      '500    ‡aOsat 1 ja 2 yhteensidotut.'
    );
    expect(runExtractor()).to.eql(SURE);
  });

  it('it should return null for fields without substring "sido"', () => {
    primeRecords(
      '500    ‡aLiibalaaba',
      '500    ‡aLubbadubba'
    );
    expect(runExtractor()).to.eql(null);
  });

  it('it should return ABSOLUTELY_NOT_DOUBLE for differing fields with substring "sido"', () => {
    primeRecords(
      '500    ‡aLiibalaaba sidottu',
      '500    ‡aLubbadubba sidottu'
    );
    expect(runExtractor()).to.eql(ABSOLUTELY_NOT_DOUBLE);
  });

  it('it should return ABSOLUTELY_NOT_DOUBLE for if only other record has field with substring "sido"', () => {
    primeRecords(
      '500    ‡aSamassa nidoksessa yhteensidottu: Reigin pappi (1926).',
      '500    ‡aLubbadubba'
    );
    expect(runExtractor()).to.eql(ABSOLUTELY_NOT_DOUBLE);
  });
  it('it should return ABSOLUTELY_NOT_DOUBLE for if only other record has field 500 ', () => {
    primeRecords(
      '500    ‡aSamassa nidoksessa yhteensidottu: Reigin pappi (1926).'
    );
    expect(runExtractor()).to.eql(ABSOLUTELY_NOT_DOUBLE);
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
