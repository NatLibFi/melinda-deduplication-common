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

const F337_F338 = require('./feature-F337-F338');

describe('F337_F338', () => {
  let record1;
  let record2;

  beforeEach(() => {
    record1 = new MarcRecord();
    record2 = new MarcRecord();

    record1.leader = '^^^^^ccm^a22004934i^4500';
    record2.leader = '^^^^^ccm^a22004934i^4500';
  });

  function runExtractor() {
    const extractor = F337_F338(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    return extractor.check();
  }

  it('should return null if either record is missing the field', () => {
    record1.appendField(Utils.stringToField('337    ‡akäytettävissä ilman laitetta‡bn‡2rdamedia'));
    record2.appendField(Utils.stringToField('338    ‡anide‡bnc‡2rdacarrier'));

    expect(runExtractor()).to.eql([null, null]);
  });

  it('should return SURE for same values', () => {
    record1.appendField(Utils.stringToField('337    ‡akäytettävissä ilman laitetta‡bn‡2rdamedia'));
    record1.appendField(Utils.stringToField('338    ‡anide‡bnc‡2rdacarrier'));

    record2.appendField(Utils.stringToField('337    ‡akäytettävissä ilman laitetta‡bn‡2rdamedia'));
    record2.appendField(Utils.stringToField('338    ‡anide‡bnc‡2rdacarrier'));

    expect(runExtractor()).to.eql([SURE, SURE]);
  });

  it('should return ABSOLUTELY_NOT_DOUBLE for different values in 338', () => {
    record1.appendField(Utils.stringToField('337    ‡akäytettävissä ilman laitetta‡bn‡2rdamedia'));
    record1.appendField(Utils.stringToField('338    ‡anide‡bnc‡2rdacarrier'));

    record2.appendField(Utils.stringToField('337    ‡atietokonekäyttöinen‡bc‡2rdamedia '));
    record2.appendField(Utils.stringToField('338    ‡averkkoaineisto‡bcr‡2rdacarrier'));

    expect(runExtractor()).to.eql([SURELY_NOT, ABSOLUTELY_NOT_DOUBLE]);
  });

  it('should return ABSOLUTELY_NOT_DOUBLE for non-identical sets in 338', () => {
    record1.appendField(Utils.stringToField('337    ‡auseita välittäviä laitteita‡bx‡2rdamedia'));
    record1.appendField(Utils.stringToField('338    ‡aäänilevy‡bsd‡2rdacarrier'));

    record2.appendField(Utils.stringToField('337    ‡auseita välittäviä laitteita‡bz‡2rdamedia'));
    record2.appendField(Utils.stringToField('338    ‡amuu‡bnz‡2rdacarrier'));
    record2.appendField(Utils.stringToField('338    ‡aäänikasetti‡bss‡2rdacarrier'));
    record2.appendField(Utils.stringToField('338    ‡aäänilevy‡bsd‡2rdacarrier'));

    expect(runExtractor()).to.eql([SURE, ABSOLUTELY_NOT_DOUBLE]);
  });
});
