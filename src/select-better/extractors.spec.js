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
const extractors = require('./extractors');

describe('extractors', () => {
  let testRecord;

  beforeEach(() => {
    testRecord = new MarcRecord({
      leader: '00000cam^a22003017i^4500',
      fields: []
    });
  });

  describe('specificFieldValue extractor', () => {
    beforeEach(() => {
      testRecord.appendField(['LOW', '', '', 'a', 'ORG_A']);
      testRecord.appendField(['SID', '', '', 'b', 'ORG_B']);
      testRecord.appendField(['500', '', '', 'a', 'ORG_X']);
    });

    it('should return 1 if record has ORG_A in LOW,a', () => {
      const contains_ORG_A = extractors.specificFieldValue('LOW', ['a'], 'ORG_A');
      expect(contains_ORG_A(testRecord)).to.equal(1);
    });

    it('should return 1 if record has ORB_B in SID,b', () => {
      const contains_ORG_B = extractors.specificFieldValue('SID', ['b'], 'ORG_B');
      expect(contains_ORG_B(testRecord)).to.equal(1);
    });

    it('should return 0 if record does not have specified value in field', () => {
      const contains_ORG_X = extractors.specificFieldValue('LOW', ['a'], 'ORG_X');
      expect(contains_ORG_X(testRecord)).to.equal(0);
    });
  });

  describe('localOwnerCount extractor', () => {
    beforeEach(() => {
      testRecord.appendField(['LOW', '', '', 'a', 'ORGANIZATION1']);
      testRecord.appendField(['LOW', '', '', 'a', 'ORGANIZATION2']);
      testRecord.appendField(['LOW', '', '', 'a', 'ORGANIZATION3']);
      testRecord.appendField(['SID', '', '', 'b', 'organization3']);
      testRecord.appendField(['SID', '', '', 'b', 'organization4']);
    });

    it('should calculate local owners correctly from LOW and SID fields', () => {
      expect(extractors.localOwnerCount(testRecord)).to.equal(4);
    });
  });

  describe('latestChangeByHuman extractor', () => {
    beforeEach(() => {
      testRecord.appendControlField(['005', '20141219114925.0']);

      testRecord.appendField(['CAT', '', '', 'a', 'LOAD-HELKA', 'b', '', 'c', '20140812', 'l', 'FIN01', 'h', '2333']);
      testRecord.appendField(['CAT', '', '', 'a', 'LOAD-HELKA', 'b', '', 'c', '20111215', 'l', 'FIN01', 'h', '0529']);
      testRecord.appendField(['CAT', '', '', 'a', 'LOAD-FIX', 'b', '30', 'c', '20141219', 'l', 'FIN01', 'h', '1145']);
      testRecord.appendField(['CAT', '', '', 'a', 'CONV-ISBD', 'b', '', 'c', '20120401', 'l', 'FIN01', 'h', '2007']);
      testRecord.appendField(['CAT', '', '', 'a', 'KVP1008', 'b', '30', 'c', '20131219', 'l', 'FIN01']);
      testRecord.appendField(['CAT', '', '', 'a', 'KVP1008', 'b', '30', 'c', '20131215', 'l', 'FIN01']);
    });

    function isHumanFilter(userName) {
      if (userName.substr(0, 5) === 'LOAD-') {
        return false;
      }
      if (userName.substr(0, 5) === 'CONV-') {
        return false;
      }
      return true;
    }

    it('should find proper latest change from record with filter', () => {
      const latestChangeByHuman = extractors.latestChange(isHumanFilter);
      expect(latestChangeByHuman(testRecord)).to.equal('201312190000');
    });

    it('should find absolute latest change from record without filter', () => {
      const latestChange = extractors.latestChange();
      expect(latestChange(testRecord)).to.equal('201412191145');
    });

    it('should default to field 005 if there aren\'t any (unfiltered) CAT fields', () => {
      const latestChange = extractors.latestChange(() => false);
      expect(latestChange(testRecord)).to.equal('201412191149');
    });
  });

  describe('recordAge extractor', () => {
    beforeEach(() => {
      testRecord.appendControlField(['008', '850506s1983^^^^xxu|||||||||||||||||eng||']);
    });

    it('should extract record age from 008', () => {
      expect(extractors.recordAge(testRecord)).to.equal('850506');
    });
  });

  describe('publicationYear extractor', () => {
    beforeEach(() => {
      testRecord.appendControlField(['008', '850506s1983^^^^xxu|||||||||||||||||eng||']);
    });

    it('should extract publication year from 008/07-11', () => {
      expect(extractors.publicationYear(testRecord)).to.equal('1983');
    });
  });

  describe('catalogingSourceFrom008 extractor', () => {
    beforeEach(() => {
      testRecord.appendControlField(['008', '850506s1983^^^^xxu|||||||||||||||||eng||']);
    });

    function setCatalogingSource(record, newLevel) {
      const field008 = record.fields.filter(field => {
        return field.tag === '008';
      })[0];
      field008.value = field008.value.substr(0, 39) + newLevel + record.leader.substr(39 + newLevel.length);
    }

    it('should extract cataloging source from 008', () => {
      expect(extractors.catalogingSourceFrom008(testRecord)).to.be.within(0, 4);
    });

    it('should give 4 points for source ^', () => {
      setCatalogingSource(testRecord, '^');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(4);
    });

    it('should give 3 points for source c', () => {
      setCatalogingSource(testRecord, 'c');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(3);
    });

    it('should give 2 points for source d', () => {
      setCatalogingSource(testRecord, 'd');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(2);
    });

    it('should give 1 points for source u', () => {
      setCatalogingSource(testRecord, 'u');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(1);
    });

    it('should give 0 points for source |', () => {
      setCatalogingSource(testRecord, '|');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(0);
    });

    it('should give 0 points for source X (invalid)', () => {
      setCatalogingSource(testRecord, 'X');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(0);
    });
  });

  describe('encodingLevel extractor', () => {
    function setEncodingLevel(record, newLevel) {
      record.leader = record.leader.substr(0, 17) + newLevel + record.leader.substr(17 + newLevel.length);
    }

    it('should extract encoding level from leader', () => {
      const encodingLevel = extractors.encodingLevel(testRecord);
      expect(encodingLevel).to.be.within(0, 5);
    });

    it('should give 4 points for encoding level ^', () => {
      setEncodingLevel(testRecord, '^');

      expect(extractors.encodingLevel(testRecord)).to.equal(4);
    });

    it('should return 0 for encoding levels u,z', () => {
      setEncodingLevel(testRecord, 'u');
      expect(extractors.encodingLevel(testRecord)).to.equal(0);
      setEncodingLevel(testRecord, 'z');
      expect(extractors.encodingLevel(testRecord)).to.equal(0);
    });

    it('should give 3 point for encoding levels 1,2,4', () => {
      setEncodingLevel(testRecord, '1');
      expect(extractors.encodingLevel(testRecord)).to.equal(3);
      setEncodingLevel(testRecord, '2');
      expect(extractors.encodingLevel(testRecord)).to.equal(3);
      setEncodingLevel(testRecord, '4');
      expect(extractors.encodingLevel(testRecord)).to.equal(3);
    });

    it('should give 2 point for encoding levels 5,7', () => {
      setEncodingLevel(testRecord, '5');
      expect(extractors.encodingLevel(testRecord)).to.equal(2);
      setEncodingLevel(testRecord, '7');
      expect(extractors.encodingLevel(testRecord)).to.equal(2);
    });

    it('should give 1 point for encoding levels 8,3', () => {
      setEncodingLevel(testRecord, '8');
      expect(extractors.encodingLevel(testRecord)).to.equal(1);
      setEncodingLevel(testRecord, '3');
      expect(extractors.encodingLevel(testRecord)).to.equal(1);
    });

    it('should give 0 for encoding level K (invalid)', () => {
      setEncodingLevel(testRecord, 'K');
      expect(extractors.encodingLevel(testRecord)).to.equal(0);
    });
  });

  describe('specificSingleLocalOwner', () => {
    it('should return 1 if the record contains viven local owner as only local owner', () => {
      testRecord.appendField(['LOW', '', '', 'a', 'ORG_A']);
      expect(extractors.specificSingleLocalOwner('ORG_A')(testRecord)).to.equal(1);
    });

    it('should return 0 if the record does not contain given local owner', () => {
      testRecord.appendField(['LOW', '', '', 'a', 'ORG_A']);
      expect(extractors.specificSingleLocalOwner('ORG_B')(testRecord)).to.equal(0);
    });

    it('should return 0 if the record contains multiple local owners', () => {
      testRecord.appendField(['LOW', '', '', 'a', 'ORG_A']);
      testRecord.appendField(['LOW', '', '', 'a', 'ORG_B']);
      expect(extractors.specificSingleLocalOwner('ORG_A')(testRecord)).to.equal(0);
    });
  });

  describe('reprintInfo', () => {
    it('should extract year from 008 and reprint information from field 500', () => {
      testRecord.appendField(['500', '', '', 'a', 'Lisäpainokset: 2.p. 2017']);
      expect(extractors.reprintInfo(testRecord)).to.eql({
        notesOnReprints: ['Lisäpainokset: 2.p. 2017'],
        year: '||||'
      });
    });

    it('should only show notes on reprints that contain reprint data in field 500', () => {
      testRecord.appendField(['500', '', '', 'a', 'Content that is not about reprints.']);
      expect(extractors.reprintInfo(testRecord)).to.eql({
        notesOnReprints: [],
        year: '||||'
      });
    });
  });

  describe('extractFieldCount', () => {
    beforeEach(() => {
      testRecord.appendControlField(['005', '20141219114925.0']);

      testRecord.appendField(['CAT', '', '', 'a', 'LOAD-HELKA', 'b', '', 'c', '20140812', 'l', 'FIN01', 'h', '2333']);
      testRecord.appendField(['CAT', '', '', 'a', 'LOAD-HELKA', 'b', '', 'c', '20111215', 'l', 'FIN01']);
    });

    it('should return the number of fields in the record', () => {
      expect(extractors.fieldCount('CAT')(testRecord)).to.equal(2);
      expect(extractors.fieldCount('005')(testRecord)).to.equal(1);
    });

    it('should return the number of field+subfields in the record', () => {
      expect(extractors.fieldCount('CAT', ['h'])(testRecord)).to.equal(1);
      expect(extractors.fieldCount('CAT', ['c'])(testRecord)).to.equal(2);
    });
  });

  describe('extractFieldLength', () => {
    const otherRecord = new MarcRecord(testRecord);
    beforeEach(() => {
      testRecord.appendField(['250', '', '', 'a', '8. völlig neu bearb. Aufl.', '6', '6880-02']);
    });

    it('should return the number of characters in the selected field', () => {
      expect(extractors.fieldLength('250')(testRecord)).to.equal(33);
    });

    it('should return 0 if the field is missing', () => {
      expect(extractors.fieldLength('250')(otherRecord)).to.equal(0);
    });
  });

  describe('extractNonFinnishHELKA', () => {
    let testRecordNotFinnishInHelka;
    let testRecordNotFinnishNotHelka;
    let testRecordInFinnishInHelka;

    beforeEach(() => {
      testRecordNotFinnishInHelka = new MarcRecord(testRecord);
      testRecordNotFinnishInHelka.appendControlField(['008', '850506s1983^^^^xxu|||||||||||||||||eng||']);
      testRecordNotFinnishInHelka.appendField(['LOW', '', '', 'a', 'HELKA']);

      testRecordNotFinnishNotHelka = new MarcRecord(testRecord);
      testRecordNotFinnishNotHelka.appendControlField(['008', '850506s1983^^^^xxu|||||||||||||||||eng||']);

      testRecordInFinnishInHelka = new MarcRecord(testRecord);
      testRecordInFinnishInHelka.appendControlField(['008', '850506s1983^^^^xxu|||||||||||||||||fin||']);
      testRecordInFinnishInHelka.appendField(['LOW', '', '', 'a', 'HELKA']);
    });

    it('should return 1 if the record is in HELKA and is not in finnish', () => {
      expect(extractors.nonFinnishHELKA(testRecordNotFinnishInHelka)).to.equal(1);
    });
    it('should return 0 if the record is not in HELKA and is not in finnish', () => {
      expect(extractors.nonFinnishHELKA(testRecordNotFinnishNotHelka)).to.equal(0);
    });
    it('should return 0 if the record is in HELKA and is in finnish', () => {
      expect(extractors.nonFinnishHELKA(testRecordInFinnishInHelka)).to.equal(0);
    });
  });

  describe('field008nonEmptyCount', () => {
    let rec;

    beforeEach(() => {
      rec = new MarcRecord();
      rec.appendControlField(['008', '850506s1983^^^^xxu|||||||||||||||||eng||']);
    });

    it('should return the number of nonEmpty (|,^) characters in the 008', () => {
      expect(extractors.field008nonEmptyCount(rec)).to.equal(17);
    });

    it('should return 0 if record is missing 008', () => {
      expect(extractors.field008nonEmptyCount(new MarcRecord())).to.equal(0);
    });
  });

  describe('containsValue', () => {
    let rec;
    beforeEach(() => {
      rec = new MarcRecord();
      rec.appendControlField(['008', '850506s1983^^^^xxu|||||||||||||||||eng||']);
    });

    it('should return 0 if the record does not have any subfield in with value', () => {
      rec.appendField(['260', '', '', 'a', '300s.', 'b', 'stuf']);
      expect(extractors.containsValue(['260'], ['testvalue'])(rec)).to.equal(0);
    });

    it('should return 1 if the record has subfield in with any value', () => {
      rec.appendField(['260', '', '', 'a', '300s.', 'b', '[tuntematon]']);
      expect(extractors.containsValue(['260'], ['testvalue', 'tuntematon'])(rec)).to.equal(1);
    });
  });

  describe('uppercaseSubfield', () => {
    let rec;

    beforeEach(() => {
      rec = new MarcRecord();
      rec.appendControlField(['008', '850506s1983^^^^xxu|||||||||||||||||eng||']);
    });

    it('should return 1 if the record has some subfield in uppercase', () => {
      rec.appendField(['300', '', '', 'a', '300s.', 'b', 'RANDOM TEXT']);

      expect(extractors.uppercaseSubfield(rec)).to.equal(1);
    });

    it('should return 0 if the record does not have any subfield in uppercase', () => {
      rec.appendField(['300', '', '', 'a', '300s.', 'b', 'stufa']);

      expect(extractors.uppercaseSubfield(rec)).to.equal(0);
    });

    it('should return 0 if the record has control subfield in uppercase', () => {
      rec.appendField(['300', '', '', 'a', '300s.', 'b', 'stufa', '9', '<FENNI>KEEP']);
      rec.appendField(['300', '', '', 'a', '300s.', 'b', 'stufa', '9', '<FENNI>KEEP']);
      rec.appendField(['LOW', '', '', 'a', 'ORGANIZATION1']);
      rec.appendField(['CAT', '', '', 'a', 'CONV-ISBD', 'b', '', 'c', '20120401', 'l', 'FIN01', 'h', '2007']);

      expect(extractors.uppercaseSubfield(rec)).to.equal(0);
    });

    it('should return 0 if the record has numeric subfield', () => {
      rec.appendField(['300', '', '', 'a', '2131']);
      expect(extractors.uppercaseSubfield(rec)).to.equal(0);
    });

    it('should return 0 if the record has short uppercase subfield', () => {
      rec.appendField(['300', '', '', 'a', 'A.']);
      expect(extractors.uppercaseSubfield(rec)).to.equal(0);
    });

    it('should return 0 if the record has short uppercase subfield', () => {
      rec.appendField(['300', '', '', 'a', 'UNESCO']);
      expect(extractors.uppercaseSubfield(rec)).to.equal(0);
    });

    it('should return 0 if the record has both uppercase and lowercase text in subfield', () => {
      rec.appendField(['300', '', '', 'a', 'UNESCO kohde']);
      expect(extractors.uppercaseSubfield(rec)).to.equal(0);
    });

    it('should return 1 if the record has uppercase subfield', () => {
      rec.appendField(['300', '', '', 'a', 'KIRJAPAINO 2']);
      expect(extractors.uppercaseSubfield(rec)).to.equal(1);
    });
  });
});
