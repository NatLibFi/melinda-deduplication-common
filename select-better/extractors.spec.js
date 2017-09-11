
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
  
  describe('specificFieldValue extractor', function() {

    beforeEach(() => {
      testRecord.appendField(['LOW','','','a','ORG_A']);
      testRecord.appendField(['SID','','','b','ORG_B']);
      testRecord.appendField(['500','','','a','ORG_X']);
    });

    it('should return 1 if record has ORG_A in LOW,a', function() {
      var contains_ORG_A = extractors.specificFieldValue('LOW', ['a'], 'ORG_A');
      expect(contains_ORG_A(testRecord)).to.equal(1);
    });

    it('should return 1 if record has ORB_B in SID,b', function() {
      var contains_ORG_B = extractors.specificFieldValue('SID', ['b'], 'ORG_B');
      expect(contains_ORG_B(testRecord)).to.equal(1);
    });

    it('should return 0 if record does not have specified value in field', function() {
      var contains_ORG_X = extractors.specificFieldValue('LOW', ['a'], 'ORG_X');
      expect(contains_ORG_X(testRecord)).to.equal(0);
    });
  });
  
  describe('localOwnerCount extractor', function() {
    
    beforeEach(() => {
      testRecord.appendField(['LOW','','','a','ORGANIZATION1']);
      testRecord.appendField(['LOW','','','a','ORGANIZATION2']);
      testRecord.appendField(['LOW','','','a','ORGANIZATION3']);
      testRecord.appendField(['SID','','','b','organization3']);
      testRecord.appendField(['SID','','','b','organization4']);
    });

    it('should calculate local owners correctly from LOW and SID fields', function() {
      expect(extractors.localOwnerCount(testRecord)).to.equal(4);
    });
  });

  describe('latestChangeByHuman extractor', function() {
    
    beforeEach(() => {
      testRecord.appendControlField(['005','20141219114925.0']);

      testRecord.appendField(['CAT','','','a','LOAD-HELKA','b','',  'c','20140812','l','FIN01','h','2333']);
      testRecord.appendField(['CAT','','','a','LOAD-HELKA','b','',  'c','20111215','l','FIN01','h','0529']);
      testRecord.appendField(['CAT','','','a','LOAD-FIX',  'b','30','c','20141219','l','FIN01','h','1145']);
      testRecord.appendField(['CAT','','','a','CONV-ISBD', 'b','',  'c','20120401','l','FIN01','h','2007']);
      testRecord.appendField(['CAT','','','a','KVP1008',   'b','30','c','20131219','l','FIN01']);
      testRecord.appendField(['CAT','','','a','KVP1008',   'b','30','c','20131215','l','FIN01']);
    });

    function isHumanFilter(userName) {
      if (userName.substr(0,5) === 'LOAD-') {
        return false;
      }
      if (userName.substr(0,5) === 'CONV-') {
        return false;
      }
      return true;
    }

    it('should find proper latest change from record with filter', function() {
      var latestChangeByHuman = extractors.latestChange(isHumanFilter);
      expect(latestChangeByHuman(testRecord)).to.equal('201312190000');
    });

    it('should find absolute latest change from record without filter', function() {
      var latestChange = extractors.latestChange();
      expect(latestChange(testRecord)).to.equal('201412191145');
    });
    
    it('should default to field 005 if there aren\'t any (unfiltered) CAT fields', function() {
      var latestChange = extractors.latestChange(() => false);
      expect(latestChange(testRecord)).to.equal('201412191149');
    });
  });
  
  describe('recordAge extractor', function() {
    beforeEach(() => {
      testRecord.appendControlField(['008','850506s1983^^^^xxu|||||||||||||||||eng||']);
    });

    it('should extract record age from 008', function() {
      expect(extractors.recordAge(testRecord)).to.equal('850506');
    });
  });

  describe('publicationYear extractor', function() {
    beforeEach(() => {
      testRecord.appendControlField(['008','850506s1983^^^^xxu|||||||||||||||||eng||']);
    });

    it('should extract publication year from 008/07-11', function() {
      expect(extractors.publicationYear(testRecord)).to.equal('1983');
    });
  });

  describe('catalogingSourceFrom008 extractor', function() {
    
    beforeEach(() => {
      testRecord.appendControlField(['008','850506s1983^^^^xxu|||||||||||||||||eng||']);
    });

    function setCatalogingSource(record, newLevel) {
      var field008 = record.fields.filter(function(field) { return field.tag === '008';})[0];
      field008.value = field008.value.substr(0,39) + newLevel + record.leader.substr(39+newLevel.length);
    }

    it('should extract cataloging source from 008', function() {
      expect(extractors.catalogingSourceFrom008(testRecord)).to.be.within(0,4);
    });

    it('should give 4 points for source ^', function() {
      setCatalogingSource(testRecord, '^');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(4);
    });

    it('should give 3 points for source c', function() {
      setCatalogingSource(testRecord, 'c');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(3);
    });

    it('should give 2 points for source d', function() {
      setCatalogingSource(testRecord, 'd');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(2);
    });

    it('should give 1 points for source u', function() {
      setCatalogingSource(testRecord, 'u');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(1);
    });

    it('should give 0 points for source |', function() {
      setCatalogingSource(testRecord, '|');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(0);
    });

    it('should give 0 points for source X (invalid)', function() {
      setCatalogingSource(testRecord, 'X');
      expect(extractors.catalogingSourceFrom008(testRecord)).to.equal(0);
    });

  });
  
  describe('encodingLevel extractor', function() {

    function setEncodingLevel(record, newLevel) {
      record.leader = record.leader.substr(0,17) + newLevel + record.leader.substr(17+newLevel.length);
    }
    
    it('should extract encoding level from leader', function() {
      var encodingLevel = extractors.encodingLevel(testRecord);
      expect(encodingLevel).to.be.within(0,5);
    });

    it('should give 4 points for encoding level ^', function() {

      setEncodingLevel(testRecord,'^');

      expect(extractors.encodingLevel(testRecord)).to.equal(4);
    });

    it('should return 0 for encoding levels u,z', function() {

      setEncodingLevel(testRecord,'u');
      expect(extractors.encodingLevel(testRecord)).to.equal(0);
      setEncodingLevel(testRecord,'z');
      expect(extractors.encodingLevel(testRecord)).to.equal(0);
    });

    it('should give 3 point for encoding levels 1,2,4', function() {

      setEncodingLevel(testRecord,'1');
      expect(extractors.encodingLevel(testRecord)).to.equal(3);
      setEncodingLevel(testRecord,'2');
      expect(extractors.encodingLevel(testRecord)).to.equal(3);
      setEncodingLevel(testRecord,'4');
      expect(extractors.encodingLevel(testRecord)).to.equal(3);
    });



    it('should give 2 point for encoding levels 5,7', function() {

      setEncodingLevel(testRecord,'5');
      expect(extractors.encodingLevel(testRecord)).to.equal(2);
      setEncodingLevel(testRecord,'7');
      expect(extractors.encodingLevel(testRecord)).to.equal(2);

    });

    it('should give 1 point for encoding levels 8,3', function() {

      setEncodingLevel(testRecord,'8');
      expect(extractors.encodingLevel(testRecord)).to.equal(1);
      setEncodingLevel(testRecord,'3');
      expect(extractors.encodingLevel(testRecord)).to.equal(1);
    });

    it('should give 0 for encoding level K (invalid)', function() {

      setEncodingLevel(testRecord,'K');
      expect(extractors.encodingLevel(testRecord)).to.equal(0);
    });
  });

  describe('specificSingleLocalOwner', () => {

    it('should return 1 if the record contains viven local owner as only local owner', function() {
      testRecord.appendField(['LOW','','','a','ORG_A']);
      expect(extractors.specificSingleLocalOwner('ORG_A')(testRecord)).to.equal(1);
    });

    it('should return 0 if the record does not contain given local owner', function() {
      testRecord.appendField(['LOW','','','a','ORG_A']);
      expect(extractors.specificSingleLocalOwner('ORG_B')(testRecord)).to.equal(0);
    });

    it('should return 0 if the record contains multiple local owners', function() {
      testRecord.appendField(['LOW','','','a','ORG_A']);
      testRecord.appendField(['LOW','','','a','ORG_B']);
      expect(extractors.specificSingleLocalOwner('ORG_A')(testRecord)).to.equal(0);
    });
    
  });

  describe('reprintInfo', () => {
    
    it('should extract year from 008 and reprint information from field 500', function() {
      testRecord.appendField(['500','','','a','Lisäpainokset: 2.p. 2017']);
      expect(extractors.reprintInfo(testRecord)).to.eql({
        notesOnReprints: ['Lisäpainokset: 2.p. 2017'],
        year: '||||'
      });
    });
    
    it('should only show notes on reprints that contain reprint data in field 500', function() {
      testRecord.appendField(['500','','','a','Content that is not about reprints.']);
      expect(extractors.reprintInfo(testRecord)).to.eql({
        notesOnReprints: [],
        year: '||||'
      });
    });
  });


  describe('extractFieldCount', function() {


    beforeEach(() => {
      testRecord.appendControlField(['005','20141219114925.0']);
     
      testRecord.appendField(['CAT','','','a','LOAD-HELKA','b','',  'c','20140812','l','FIN01','h','2333']);
      testRecord.appendField(['CAT','','','a','LOAD-HELKA','b','',  'c','20111215','l','FIN01']);

    });

    it('should return the number of fields in the record', function() {
      expect(extractors.fieldCount('CAT')(testRecord)).to.equal(2);
      expect(extractors.fieldCount('005')(testRecord)).to.equal(1);
    });

    it('should return the number of field+subfields in the record', function() {
      expect(extractors.fieldCount('CAT', ['h'])(testRecord)).to.equal(1);
      expect(extractors.fieldCount('CAT', ['c'])(testRecord)).to.equal(2);
    });
  });

  describe('extractFieldLength', function() {
    var otherRecord = new MarcRecord(testRecord);
    beforeEach(() => {
      testRecord.appendField(['250','','','a','8. völlig neu bearb. Aufl.', '6', '6880-02']);
       
    });
    
    it('should return the number of characters in the selected field', function() {
      expect(extractors.fieldLength('250')(testRecord)).to.equal(33);
    });

    it('should return 0 if the field is missing', function() {
      expect(extractors.fieldLength('250')(otherRecord)).to.equal(0);
    });
      
  });


  describe('extractNonFinnishHELKA', function() {

    let testRecordNotFinnishInHelka;
    let testRecordNotFinnishNotHelka;
    let testRecordInFinnishInHelka;

    beforeEach(() => {
     
      testRecordNotFinnishInHelka = new MarcRecord(testRecord);
      testRecordNotFinnishInHelka.appendControlField(['008','850506s1983^^^^xxu|||||||||||||||||eng||']);
      testRecordNotFinnishInHelka.appendField(['LOW','','','a','HELKA']);

      testRecordNotFinnishNotHelka = new MarcRecord(testRecord);
      testRecordNotFinnishNotHelka.appendControlField(['008','850506s1983^^^^xxu|||||||||||||||||eng||']);
      
      testRecordInFinnishInHelka = new MarcRecord(testRecord);
      testRecordInFinnishInHelka.appendControlField(['008','850506s1983^^^^xxu|||||||||||||||||fin||']);
      testRecordInFinnishInHelka.appendField(['LOW','','','a','HELKA']);
      
    });

    it('should return 1 if the record is in HELKA and is not in finnish', function() {
      expect(extractors.nonFinnishHELKA(testRecordNotFinnishInHelka)).to.equal(1);
    });
    it('should return 0 if the record is not in HELKA and is not in finnish', function() {
      expect(extractors.nonFinnishHELKA(testRecordNotFinnishNotHelka)).to.equal(0);
    });
    it('should return 0 if the record is in HELKA and is in finnish', function() {
      expect(extractors.nonFinnishHELKA(testRecordInFinnishInHelka)).to.equal(0);
    });
  });

  describe('field008nonEmptyCount', function() {

    let rec;

    beforeEach(() => {
      
      rec = new MarcRecord();
      rec.appendControlField(['008','850506s1983^^^^xxu|||||||||||||||||eng||']);
  
    });

    it('should return the number of nonEmpty (|,^) characters in the 008', function() {
      expect(extractors.field008nonEmptyCount(rec)).to.equal(17);
    });
    
    it('should return 0 if record is missing 008', function() {
      expect(extractors.field008nonEmptyCount(new MarcRecord())).to.equal(0);
    });
    

  });

});