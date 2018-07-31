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
const MarcRecord = require('marc-record-js');
const RecordUtils = require('./record-utils');

const {getLastModificationDate} = require('./marc-record-utils');

describe('marc-record-utils', () => {
  describe('getLastModificationDate', () => {
    let record;
    beforeEach(() => {
      record = new MarcRecord();
    });

    it('should parse the last modification date from 005', () => {
      record.fields.push(RecordUtils.stringToField('005    20170913132213.0'));
      const expectedDate = new Date(2017, 8, 13, 13, 22, 13);
      expect(getLastModificationDate(record)).to.eql(expectedDate);
    });
  });
});
