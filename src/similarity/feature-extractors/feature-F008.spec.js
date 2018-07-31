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

const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const F008 = require('./feature-F008');

describe('F008', () => {
  let record1;
  let record2;

  beforeEach(() => {
    record1 = new MarcRecord();
    record2 = new MarcRecord();

    record1.leader = '^^^^^ccm^a22004934i^4500';
    record2.leader = '^^^^^ccm^a22004934i^4500';
  });

  it('should return null if field is missing 008', () => {
    const extractor = F008(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const label = extractor.check();

    expect(label).to.eql([null, null, null, null, null, null, null, null, null]);
  });

  it('should return SURE for identical, completely filled, 008', () => {
    record1.appendField(Utils.stringToField('008    010608s20002000fi^ppzaaaaaaaaaaaaaamulaa'));
    record2.appendField(Utils.stringToField('008    010608s20002000fi^ppzaaaaaaaaaaaaaamulaa'));

    const extractor = F008(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql([SURE, SURE, SURE, SURE, SURE, SURE, SURE, SURE, SURE]);
  });

  it('should return null for missing information', () => {
    record1.appendField(Utils.stringToField('008    ^^^^^^|||||^^^^^^^||||||||||||||||||||||'));
    record2.appendField(Utils.stringToField('008    010608s20002000fi^ppzaaaaaaaaaaaaaamulaa'));

    const extractor = F008(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql([null, null, null, null, null, null, null, null, null]);
  });

  it('should return SURELY_NOT for different 008 parts', () => {
    record1.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz||||||||||||||mul||'));
    record2.appendField(Utils.stringToField('008    010602s2000^^^^xxuppz||||||||||||||mul||'));

    const extractor = F008(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql([SURELY_NOT, SURE, SURE, null, SURELY_NOT, SURE, null, null, SURE]);
  });

  it('should return propportion of identical values in format specific for format specific extractor', () => {
    record1.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz|||xxxxxxx||||mul||'));
    record2.appendField(Utils.stringToField('008    010602s2000^^^^xxuppz|||zxxxxxx||||mul||'));

    const extractor = F008(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql([SURELY_NOT, SURE, SURE, null, SURELY_NOT, SURE, null, null, 0.75]);
  });

  it('should return null for format specific extractor if formats are different', () => {
    record1.leader = '^^^^^amm^a22004934i^4500';
    record1.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz|||x||||||||||mul||'));
    record2.appendField(Utils.stringToField('008    010602s2000^^^^xxuppz||||||||||||||mul||'));

    const extractor = F008(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql([SURELY_NOT, SURE, SURE, null, SURELY_NOT, SURE, null, null, null]);
  });

  it('should return SURE for country code if other is missing it (xx^)', () => {
    record1.leader = '^^^^^amm^a22004934i^4500';
    record1.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz|||x||||||||||mul||'));
    record2.appendField(Utils.stringToField('008    010602s2000^^^^xx^ppz|||x||||||||||mul||'));

    const extractor = F008(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql([SURELY_NOT, SURE, SURE, null, ALMOST_SURE, SURE, null, null, null]);
  });

  it('should return SURE for same languages', () => {
    record1.leader = '^^^^^amm^a22004934i^4500';
    record1.appendField(Utils.stringToField('008    901221s1978^^^^xx^|||||||||||||||||fin||'));
    record2.appendField(Utils.stringToField('008    790410s1978^^^^fi^|||||||||||||||f|fin||'));

    const extractor = F008(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql([SURELY_NOT, SURE, SURE, null, ALMOST_SURE, SURE, null, null, null]);
  });
});
