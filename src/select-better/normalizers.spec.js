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
const {moreRecent} = require('./normalizers');

describe('normalizers', () => {
  describe('moreRecent', () => {
    describe('when both records are quite recent', () => {
      it('should return 0 if records are equally recent', () => {
        const recent = moreRecent(2, 0);

        expect(recent('170606', '170606')).to.equal(0);
      });

      it('should return 1 if first record is more recent', () => {
        const recent = moreRecent(2, 0);

        expect(recent('170706', '170606')).to.equal(1);
      });

      it('should return 0 if second record is more recent', () => {
        const recent = moreRecent(2, 0);

        expect(recent('170506', '170606')).to.equal(0);
      });
    });

    it('should return 0 if records are close to each other', () => {
      const recent = moreRecent(2, 1);

      expect(recent('170606', '161206')).to.equal(0);
    });

    it('should handle YYMMDD format', () => {
      const recent = moreRecent(2, 1);

      expect(recent('170606', '991206')).to.equal(1);
    });
  });
});
