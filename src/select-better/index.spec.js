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

const defaultTestRecord =  new MarcRecord({
  leader: '00000cam^a22003017i^4500',
  fields: []
});

const extractors = require('./extractors');
const normalizers = require('./normalizers');
const selectBetter = require('.');

describe('PreferenceMelinda', function() {

  describe('generateFeatureVector', function() {

    function setEncodingLevel(record, newLevel) {
      record.leader = record.leader.substr(0,17) + newLevel + record.leader.substr(17+newLevel.length);
    }
    
    const testRecord = MarcRecord.fromString(`LDR    00000cam^a22003017i^4500
005    20141219114925.0
008    850506s1983^^^^xxu|||||||||||||||||eng||
CAT    ‡aLOAD-HELKA‡b‡c20140812‡lFIN01‡h2333
CAT    ‡aLOAD-HELKA‡b‡c20111215‡lFIN01‡h0529
CAT    ‡aLOAD-FIX‡b30‡c20141219‡lFIN01‡h1145
CAT    ‡aCONV-ISBD‡b‡c20120401‡lFIN01‡h2007
CAT    ‡aKVP1008‡b30‡c20131219‡lFIN01
CAT    ‡aKVP1008‡b30‡c20131215‡lFIN01
LOW    ‡aFENNI
SID    ‡bviola
500    ‡aORG_X
`);

    var otherTestRecord = new MarcRecord(defaultTestRecord);
    otherTestRecord.appendControlField(['005', '20131219114925.0']);
    otherTestRecord.appendControlField(['008', '870506s1983^^^^xxu|||||||||||||||||eng||']);

    setEncodingLevel(otherTestRecord, 'u');
    setEncodingLevel(testRecord, '^');

    it('should generate proper feature vector', function() {
      var featureArray = [
        { encodingLevel: [extractors.encodingLevel] }, 
        { catalogingSourceFrom008: [extractors.catalogingSourceFrom008] },
        { recordAge: [extractors.recordAge] },
        { localOwnerCount: [extractors.localOwnerCount] },
        { latestChange: [extractors.latestChange()] },
        { FENNI: [extractors.specificLocalOwner('FENNI')] },
        { VIOLA: [extractors.specificLocalOwner('VIOLA')] }
      ];
    
      var vector = selectBetter.generateFeatureVector(selectBetter.generateFeatures(testRecord, featureArray));

      expect(vector).to.have.length(7);
      expect(vector).to.eql([4, 0, '850506', 2, '201412191145', 1, 1]);
    });

    it('should generate proper normalized vectors', function() {
      var featureArray = [
        { encodingLevel: [extractors.encodingLevel, normalizers.notNull] }, 
        { recordAge: [extractors.recordAge, normalizers.lexical] },
        { latestChange: [extractors.latestChange(), normalizers.lexical] }
      ];
    
      var vector1 = selectBetter.generateFeatureVector(selectBetter.generateFeatures(testRecord, featureArray));
      var vector2 = selectBetter.generateFeatureVector(selectBetter.generateFeatures(otherTestRecord, featureArray));

      expect(vector1).to.have.length(3);
      expect(vector1).to.eql([4, '850506', '201412191145']);

      expect(vector2).to.have.length(3);
      expect(vector2).to.eql([0, '870506', '201312191149']);

      selectBetter.normalizeFeatureVectors(vector1, vector2, featureArray);

      expect(vector1).to.have.length(3);
      expect(vector1).to.eql([0, 0, 1]);

      expect(vector2).to.have.length(3);
      expect(vector2).to.eql([0, 1, 0]);

    });
      
    it('should handle invert normalizer correctly', function() {
      
      var vector1 = [0];
      var vector2 = [1];
      selectBetter.normalizeFeatureVectors(vector1, vector2, [{fakeFeature: [null,normalizers.invert]}]);
      expect(vector1).to.eql([1]);
      expect(vector2).to.eql([0]);

    });

    describe('reprint normalizer', () => {

      let record1;
      let record2;

      let reprintVector1;
      let reprintVector2;
      
      let fakeExtractorSet;

      beforeEach(() => {

        record1 = new MarcRecord(defaultTestRecord);
        record2 = new MarcRecord(defaultTestRecord);

        record1.appendControlField(['008','860819s1975^^^^sw^|||||||||||||||||rus||']);
        record1.appendField(['500','','','a','Lisäpainokset: Repr. 1982.']);
        
        record2.appendControlField(['008', '860819s1982^^^^sw^|||||||||||||||||rus||']);
        
        reprintVector1 = [ extractors.reprintInfo(record1) ];
        reprintVector2 = [ extractors.reprintInfo(record2) ];

        fakeExtractorSet = [{fakeFeature: [null,normalizers.reprint]}];
      });

      it('should give points to earlier record with reprint info that contains the year of the latter record.', function() {
        selectBetter.normalizeFeatureVectors(reprintVector1, reprintVector2, fakeExtractorSet);
        expect(reprintVector1[0]).to.equal(1);
      });

      it('should not give points to latter record if earlier record has reprint info that contains the year of the latter record.', function() {
        selectBetter.normalizeFeatureVectors(reprintVector1, reprintVector2, fakeExtractorSet);
        expect(reprintVector2[0]).to.equal(0);
      });
    });
  });

});
