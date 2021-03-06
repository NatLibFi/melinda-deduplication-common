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
const {MarcRecord} = require('@natlibfi/marc-record');
const Utils = require('./utils');

const ISSN = require('./feature-ISSN');

describe('ISSN', () => {
  let record1;
  let record2;

  beforeEach(() => {
    record1 = new MarcRecord();
    record2 = new MarcRecord();
  });

  describe('for records published after 1974', () => {
    beforeEach(() => {
      record1.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz||||||||||||||mul||'));
      record2.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz||||||||||||||mul||'));
    });

    it('should return null if either is missing ISSN', () => {
      record1.appendField(Utils.stringToField('022    ‡a1022-9299'));

      const extractor = ISSN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(null);
    });

    it('should return SURE for identical ISSNs', () => {
      record1.appendField(Utils.stringToField('022    ‡a1022-9299'));
      record2.appendField(Utils.stringToField('022    ‡a1022-9299'));

      const extractor = ISSN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(Labels.SURE);
    });

    it('should return SURE if other has the ISSN in y subfield (wrong issn)', () => {
      record1.appendField(Utils.stringToField('022    ‡a1022-9299'));
      record2.appendField(Utils.stringToField('022    ‡a1029-8649‡y1022-9299'));

      const extractor = ISSN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(Labels.SURE);
    });
  });
});
