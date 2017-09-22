const chai = require('chai');
const expect = chai.expect;

const { Labels } = require('./constants');
const { SURE, SURELY_NOT } = Labels;

const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const size = require('./feature-size');

describe('feature-size', function() {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();
  });

  function primeRecords(strForRec1, strForRec2) {
    strForRec1 && record1.appendField(Utils.stringToField(strForRec1));
    strForRec2 && record2.appendField(Utils.stringToField(strForRec2));
  }

  function runExtractor() {

    const extractor = size(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    return extractor.check();
  }


  it('it should return SURE for identical fields', () => {
    primeRecords(
      '300    ‡a328, [1] s. juttuja:‡btaulukkoja ;‡c25 cm‡etekstiliite (12 s.)‡etekstiliite',
      '300    ‡a328, [1] s. juttuja:‡btaulukkoja ;‡c25 cm‡etekstiliite (12 s.)‡etekstiliite'
    );
    expect(runExtractor()).to.eql([SURE, SURE, SURE, SURE, SURE, SURE]);
  });

  it('it should return null for missing fields', () => {
    primeRecords(
      '300    ‡a328, [1] s. :‡btaulukkoja ;‡c25 cm‡etekstiliite (12 s.)‡etekstiliite'
    );
    expect(runExtractor()).to.eql([null, null, null, null, null, null]);
  });

  describe('for subfield a', () => {
    it('it should return SURE if largest numbers are almost same', () => {
      primeRecords(
        '300    ‡a332 s.',
        '300    ‡a[4], 331, [1] s.'
      );
      expect(runExtractor()).to.eql([SURE, null, null, null, null, null]);
    });

    it('it should return SURE if largest numbers are same and part of larger string', () => {
      primeRecords(
        '300    ‡a1 partituuri (15s.)',
        '300    ‡a1 kuoropartituuri (15 sivua) :‡bkuvitettu ;‡c30 cm'
      );
      expect(runExtractor()).to.eql([SURE, SURE, null, null, null, null]);
    });

    it('it should return SURE if largest numbers are different', () => {
      primeRecords(
        '300    ‡a332 s.',
        '300    ‡a[4], 231, [1] s.'
      );
      expect(runExtractor()).to.eql([SURELY_NOT, null, null, null, null, null]);
    });

    it('it should return SURE if largest numbers are almost same', () => {
      primeRecords(
        '300    ‡a1 kirja (24 sivua), 1 CD-äänilevy :',
        '300    ‡a1 kirja (24 s.), 1 CD-äänilevy :'
      );
      expect(runExtractor()).to.eql([SURE, SURE, null, null, null, null]);
    });

    it('it should return SURE if words match', () => {
      primeRecords(
        '300    ‡a1 kirja (127 s.), 2 CD-äänilevyä (120 min) :',
        '300    ‡a1 kirja (127 s.), 2 CD-äänilevyä :'
      );
      expect(runExtractor()).to.eql([SURE, SURE, null, null, null, null]);
    });

    it('it should return SURELY_NOT if words do not match', () => {
      primeRecords(
        '300    ‡a1 kirja (127 s.), 2 C-kasettia (120 min) :',
        '300    ‡a1 kirja (127 s.), 2 CD-äänilevyä :'
      );
      expect(runExtractor()).to.eql([SURE, SURELY_NOT, null, null, null, null]);
    });

  });

  describe('for subfield b', () => {

    it('should return SURE if records have identical field', () => {
      primeRecords(
        '300    ‡btaulukkoja, karttoja',
        '300    ‡btaulukkoja, karttoja'
      );
      expect(runExtractor()).to.eql([null, null, SURE, null, null, null]);
    });

    it('should return SURE if records have same words', () => {
      primeRecords(
        '300    ‡btaulukkoja',
        '300    ‡btaulukkoja, karttoja'
      );
      expect(runExtractor()).to.eql([null, null, SURE, null, null, null]);
    });

    it('should return SURELY_NOT if records have different words', () => {
      primeRecords(
        '300    ‡btaulukkoja, nuotteja',
        '300    ‡btaulukkoja, karttoja'
      );
      expect(runExtractor()).to.eql([null, null, SURELY_NOT, null, null, null]);
    });
  });

  describe('for subfield c', () => {
      
    it('should return SURE if records have same dimensions', () => {
      primeRecords(
        '300    ‡c25 cm',
        '300    ‡c25 cm'
      );
      expect(runExtractor()).to.eql([null, null, null, SURE, null, null]);
    });
    
    it('should return SURE if records have almost same dimensions +/- 1', () => {
      primeRecords(
        '300    ‡c25 cm',
        '300    ‡c26 cm'
      );
      expect(runExtractor()).to.eql([null, null, null, SURE, null, null]);
    });

    it('should return SURE if records have different', () => {
      primeRecords(
        '300    ‡c25 cm',
        '300    ‡c16 cm'
      );
      expect(runExtractor()).to.eql([null, null, null, SURELY_NOT, null, null]);
    });
  });
  

  describe('for subfield e', () => {
    
    it('should return SURE if records have matching terms', () => {
      primeRecords(
        '300    ‡etekstiliite (12 s.)',
        '300    ‡etekstiliite'
      );
      expect(runExtractor()).to.eql([null, null, null, null, SURE, SURE]);
    });

    it('should return SURE if records have matching terms', () => {
      primeRecords(
        '300    ‡etekstiliite (12 s.)',
        '300    ‡eC-kasetti'
      );
      expect(runExtractor()).to.eql([null, null, null, null, SURELY_NOT, SURE]);
    });

    it('should return SURELY_NOT if records have mismatching initial numbers', () => {
      primeRecords(
        '300    ‡e1 tekstiliite',
        '300    ‡e5 tekstiliitettä'
      );
      expect(runExtractor()).to.eql([null, null, null, null, SURE, SURELY_NOT]);
    });

    it('should return SURE if records have matching number in beginning', () => {
      primeRecords( 
        '300    ‡e2 CD-äänilevyä.',
        '300    ‡e2 CD-ROM.'
      );
      expect(runExtractor()).to.eql([null, null, null, null, null, SURE]);
    });

    it('should consider missing number as 1 for matching number in beginning', () => {
      primeRecords( 
        '300    ‡eCD-äänilevy.',
        '300    ‡e1 CD-äänilevy.'
      );
      expect(runExtractor()).to.eql([null, null, null, null, SURE, SURE]);
    });

  });

});


function toWeirdFormat(record) {

  return {
    controlfield: record.getControlfields().map(convertControlField),
    datafield: record.getDatafields().map(convertDataField),
  };

  function convertControlField(field) {
    return {
      $: {
        tag: field.tag
      },
      _: field.value
    };
  }
  function convertDataField(field) {
    return {
      $: {
        tag: field.tag,
        ind1: field.ind1,
        ind2: field.ind2,
      },
      subfield: field.subfields.map(convertSubfield)
    };

    function convertSubfield(subfield) {
      return {
        $: {
          code: subfield.code
        },
        _: subfield.value
      };
    }
  }
}