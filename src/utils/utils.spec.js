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

const expect = require('chai').expect;
const sinon = require('sinon');

const utils = require('./utils');

describe('utils', () => {
  describe('hrtimeToMs', () => {
    it('should convert seconds to milliseconds', () => {
      expect(utils.hrtimeToMs([13, 0])).to.equal(13000);
    });

    it('should drop precision after milliseconds', () => {
      expect(utils.hrtimeToMs([13, 1000])).to.equal(13000);
    });

    it('should convert seconds and nanoseconds to milliseconds', () => {
      expect(utils.hrtimeToMs([13, 1000000])).to.equal(13001);
    });
  });

  describe('waitAndRetry', () => {
    it('should retry thrice', async () => {
      const fakeFn = sinon.stub();
      fakeFn.onCall(0).rejects(new Error('Rejecting first call'));
      fakeFn.onCall(1).rejects(new Error('Rejecting second call'));
      fakeFn.onCall(2).rejects(new Error('Rejecting third call'));

      const onRetrySpy = sinon.spy();

      try {
        await utils.waitAndRetry(fakeFn, onRetrySpy, 10);
      } catch (error) {
        expect(error.message).to.equal('Rejecting third call');
        expect(fakeFn.callCount).to.equal(3);
        expect(onRetrySpy.callCount).to.equal(2);
      }
    });

    it('should return result if call succeeds', async () => {
      const fakeFn = sinon.stub();
      fakeFn.onCall(0).rejects(new Error('Rejecting first call'));
      fakeFn.onCall(1).rejects(new Error('Rejecting second call'));
      fakeFn.onCall(2).resolves('result');

      const onRetrySpy = sinon.spy();

      const result = await utils.waitAndRetry(fakeFn, onRetrySpy, 10);
      expect(result).to.equal('result');
      expect(fakeFn.callCount).to.equal(3);
      expect(onRetrySpy.callCount).to.equal(2);
    });
  });
});
