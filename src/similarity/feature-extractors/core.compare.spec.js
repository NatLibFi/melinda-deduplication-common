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
const compareFuncs = require('./core.compare');

describe('Compare', () => {
  describe('stringJaccard', () => {
    const stringJaccard = compareFuncs.stringJaccard;

    it('should work for strings', () => {
      const str1 = '123';
      const str2 = '234';

      expect(stringJaccard(str1, str2)).to.equal(0.5);
    });
    it('should not be concerned about string order', () => {
      const str1 = '321';
      const str2 = '234';

      expect(stringJaccard(str1, str2)).to.equal(0.5);
    });
    it('should give zero if strings have 0 similar characters', () => {
      const str1 = 'abc';
      const str2 = 'def';

      expect(stringJaccard(str1, str2)).to.equal(0);
    });
    it('should give 1 if strings are identical', () => {
      const str1 = 'abc';
      const str2 = 'abc';

      expect(stringJaccard(str1, str2)).to.equal(1);
    });
    it('should calculate jaccard correctly', () => {
      const str1 = 'abcx';
      const str2 = 'abcz';

      expect(stringJaccard(str1, str2)).to.equal(0.6);
    });
  });

  describe('setCompare', () => {
    it('should return 1 if sets have at least one identical element', () => {
      expect(compareFuncs.setCompare([1, 2, 3], [3, 4, 5])).to.equal(1);
    });
    it('should return 0 if sets have at no identical elements', () => {
      expect(compareFuncs.setCompare([1, 2, 3], [4, 5, 6])).to.equal(0);
    });
  });

  describe('isIdentical', () => {
    it('should return true for identical fields', () => {
      expect(compareFuncs.isIdentical(gfset(['a', 'b', 'c']), gfset(['a', 'b', 'c']))).to.be.true;
    });
    it('should return true for identical unordered fields', () => {
      expect(compareFuncs.isIdentical(gfset(['c', 'a', 'b']), gfset(['a', 'b', 'c']))).to.be.true;
    });
  });

  function gfset(values) {
    const fieldMock = [];
    values.forEach(value => {
      fieldMock.push({
        subfield: [
          {_: value, $: {code: 'a'}}
        ]
      });
    });

    return fieldMock;
  }

  function gf(value) {
    return [{
      subfield: [
        {_: value, $: {code: 'a'}}
      ]
    }];
  }

  describe('isIdentical with abbreviation equal function', () => {
    it('should return true for names with abbreviations', () => {
      expect(compareFuncs.isIdentical(gf('KURT VÄINÖ WALLER'), gf('KURT V WALLER'), compareFuncs.abbrComparator)).to.be.true;
    });

    it('should return true for names with multiple abbreviations', () => {
      expect(compareFuncs.isIdentical(gf('A B CDE'), gf('ABC BCD CDE'), compareFuncs.abbrComparator)).to.be.true;
    });
    it('should return false if all the elements in either name are abbreviations', () => {
      expect(compareFuncs.isIdentical(gf('A B C'), gf('ABC BCD CDE'), compareFuncs.abbrComparator)).to.be.false;
    });

    it('should return true for names with abbreviations and normal forms starting same char', () => {
      expect(compareFuncs.isIdentical(gf('A AALTO ARTTU'), gf('AALTO ARTTU ASKO'), compareFuncs.abbrComparator)).to.be.true;
    });

    it('should return false if there is different amount of elements', () => {
      expect(compareFuncs.isIdentical(gf('A'), gf('AALTO ARTTU ASKO'), compareFuncs.abbrComparator)).to.be.false;
    });

    it('should return false for isSubset if there is not proper item for each token in both strings', () => {
      expect(compareFuncs.isSubset(gf('H MERIMIES'), gf('HARRY HALEN'), compareFuncs.abbrComparator)).to.be.false;
    });
    it('should return false for isSubset if there is not proper item for each token in both strings other way around', () => {
      expect(compareFuncs.isSubset(gf('HARRY HALEN'), gf('H MERIMIES'), compareFuncs.abbrComparator)).to.be.false;
    });

    it('should return true for multiple fields', () => {
      const rec1 = gf('AALTO A ARTTU').concat(gf('JIRI J JAKO'));
      const rec2 = gf('AALTO ASKO ARTTU').concat(gf('JIRI JOUKO JAKO'));
      expect(compareFuncs.isIdentical(rec1, rec2, compareFuncs.abbrComparator)).to.be.true;
    });

    it('should return false for multiple fields if not identical', () => {
      const rec1 = gf('AALTO A ARTTU').concat(gf('JIRI J JAKO'));
      const rec2 = gf('AALTO ASKO ARTTU').concat(gf('JIRI JOUKO XX'));
      expect(compareFuncs.isIdentical(rec1, rec2, compareFuncs.abbrComparator)).to.be.false;
    });
  });

  describe('isIdentical with levenhstein equal function', () => {
    it('should return true for names with abbreviations and normal forms starting same char', () => {
      expect(compareFuncs.isIdentical(gf('AALTO'), gf('AALTO'), compareFuncs.lvComparator(1))).to.be.true;
    });
    it('should return true for names with abbreviations and normal forms starting same char', () => {
      expect(compareFuncs.isIdentical(gf('BALTO'), gf('AALTO'), compareFuncs.lvComparator(0.8))).to.be.true;
    });
    it('should return false if the items do not have at least 80% same characters', () => {
      expect(compareFuncs.isIdentical(gf('11112'), gf('22222'), compareFuncs.lvComparator(0.8))).to.be.false;
    });

    it('should return true for multiple fields', () => {
      const rec1 = gf('AALTO').concat(gf('JIRI'));
      const rec2 = gf('AALTO').concat(gf('JIRI'));
      expect(compareFuncs.isIdentical(rec1, rec2, compareFuncs.lvComparator(1))).to.be.true;
    });
    it('should return true for multiple fields', () => {
      const rec1 = gf('AALTOX').concat(gf('JIRIX'));
      const rec2 = gf('AALTO').concat(gf('JIRI'));
      expect(compareFuncs.isIdentical(rec1, rec2, compareFuncs.lvComparator(0.8))).to.be.true;
    });
  });

  describe('isIdentical with stringPartOf equal function', () => {
    it('should return true if names are equal', () => {
      expect(compareFuncs.isIdentical(gf('AALTO'), gf('AALTO'), compareFuncs.stringPartofComparator)).to.be.true;
    });
    it('should return true if other starts with another', () => {
      expect(compareFuncs.isIdentical(gf('AALTO'), gf('AALTO J'), compareFuncs.stringPartofComparator)).to.be.true;
    });
    it('should return false if other is 20% or less the length of another', () => {
      expect(compareFuncs.isIdentical(gf('12'), gf('1234567890'), compareFuncs.stringPartofComparator)).to.be.false;
    });
    it('should return true if first is in the middle of the second', () => {
      expect(compareFuncs.isIdentical(gf('CHARLES DAVIES PAUL WILLIAM'), gf('DAVIES PAUL'), compareFuncs.stringPartofComparator)).to.be.true;
    });
    it('should return true if second is in the middle of the first', () => {
      expect(compareFuncs.isIdentical(gf('DAVIES PAUL'), gf('CHARLES DAVIES PAUL WILLIAM'), compareFuncs.stringPartofComparator)).to.be.true;
    });
    it('should return false if another is not part of the other', () => {
      expect(compareFuncs.isIdentical(gf('DAVIES PAUL'), gf('AALTO J'), compareFuncs.stringPartofComparator)).to.be.false;
    });

    it('should return true for multiple fields', () => {
      const rec1 = gf('AALTO A').concat(gf('JIRI J'));
      const rec2 = gf('AALTO ARTTU').concat(gf('JIRI JOUKO'));
      expect(compareFuncs.isIdentical(rec1, rec2, compareFuncs.stringPartofComparator)).to.be.true;
    });
  });

  describe('hasIntersection', () => {
    it('should return true if fields are equal', () => {
      expect(compareFuncs.hasIntersection(gf('AALTO'), gf('AALTO'))).to.be.true;
    });

    it('should return false if fields are not equal', () => {
      expect(compareFuncs.hasIntersection(gf('AALTO UNIV'), gf('AALTO'))).to.be.false;
    });

    it('should return true if have intersecting value', () => {
      expect(compareFuncs.hasIntersection(gfset(['SINI', 'AALTO']), gfset(['SIN', 'AALTO']))).to.be.true;
    });

    it('should return true if sets are identical', () => {
      expect(compareFuncs.hasIntersection(gfset(['SINI', 'AALTO']), gfset(['SINI', 'AALTO']))).to.be.true;
    });
    it('should return false if first set is empty', () => {
      expect(compareFuncs.hasIntersection(gfset([]), gfset(['SINI', 'AALTO']))).to.be.false;
    });
    it('should return false if second set is empty', () => {
      expect(compareFuncs.hasIntersection(gfset(['SINI', 'AALTO']), gfset([]))).to.be.false;
    });
    it('should return false if both sets are empty', () => {
      expect(compareFuncs.hasIntersection(gfset([]), gfset([]))).to.be.false;
    });
  });
});
