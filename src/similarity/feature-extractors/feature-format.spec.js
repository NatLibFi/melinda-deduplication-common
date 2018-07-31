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

const format = require('./feature-format');

describe('format', () => {
  let record1;
  let record2;

  beforeEach(() => {
    record1 = new MarcRecord();
    record2 = new MarcRecord();

    record1.leader = '^^^^^ccm^a22004934i^4500';
    record2.leader = '^^^^^ccm^a22004934i^4500';
  });

  function runExtractor() {
    const extractor = format(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    return extractor.check();
  }

  it('should return null if either record has unknown format', () => {
    record1.leader = '^^^^^cXm^a22004934i^4500';
    record2.leader = '^^^^^ccm^a22004934i^4500';

    expect(runExtractor()).to.eql([null, null, null, null, null, null, null]);
  });

  it('should return SURE for given format any SURELY_NOT for others', () => {
    record1.leader = '^^^^^cam^a22004934i^4500';
    record2.leader = '^^^^^cam^a22004934i^4500';

    expect(runExtractor()).to.eql([SURE, SURELY_NOT, SURELY_NOT, SURELY_NOT, SURELY_NOT, SURELY_NOT, SURELY_NOT]);
  });

  it('should return ABSOLUTELY_NOT if records are in different formats', () => {
    record1.leader = '^^^^^cas^a22004934i^4500';
    record2.leader = '^^^^^cam^a22004934i^4500';

    expect(runExtractor()).to.eql([ABSOLUTELY_NOT_DOUBLE, ABSOLUTELY_NOT_DOUBLE, ABSOLUTELY_NOT_DOUBLE, ABSOLUTELY_NOT_DOUBLE, ABSOLUTELY_NOT_DOUBLE, ABSOLUTELY_NOT_DOUBLE, ABSOLUTELY_NOT_DOUBLE]);
  });
});
