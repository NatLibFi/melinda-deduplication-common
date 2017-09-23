const chai = require('chai');
const expect = chai.expect;

const { Labels } = require('./constants');
const { ABSOLUTELY_NOT_DOUBLE } = Labels;

const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const stopConditions = require('./feature-stop-conditions');

describe('stop conditions', function() {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();

    record1.leader = '^^^^^ccm^a22004934i^4500';
    record2.leader = '^^^^^ccm^a22004934i^4500';

  });

  function runExtractor() {
    
    const extractor = stopConditions(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    return extractor.check();
  }

  it('should return null if either record is missing the field', () => {

    record1.appendField(Utils.stringToField('008    890915s1972^^^^xxk|||||||||||||||||eng||'));
    record2.appendField(Utils.stringToField('008    901016s1972^^^^xx^|||||||||||||||||eng||'));
    record1.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    expect(runExtractor()).to.eql(null);

  });

  it('should return ABSOLUTELY_NOT_DOUBLE if isbns and publishers mismatch', () => {
    
    record1.appendField(Utils.stringToField('008    890915s1972^^^^xxk|||||||||||||||||eng||'));
    record1.appendField(Utils.stringToField('020    ‡a0-521-07432-0'));
    record1.appendField(Utils.stringToField('260    ‡aLondon,‡c1972.'));
    
    record2.appendField(Utils.stringToField('008    901016s1972^^^^xx^|||||||||||||||||eng||'));
    record2.appendField(Utils.stringToField('020    ‡a0-521-09711-8'));
    record2.appendField(Utils.stringToField('260    ‡aCambridge :‡bCambridge Univ. Pr.,‡c1972.'));
    
    expect(runExtractor()).to.eql(ABSOLUTELY_NOT_DOUBLE);
  });

  it('should return not consider ISBNs if record is pre-1971', () => {
    
    record1.appendField(Utils.stringToField('008    890915s1962^^^^xxk|||||||||||||||||eng||'));
    record1.appendField(Utils.stringToField('020    ‡a0-521-07432-0'));
    record1.appendField(Utils.stringToField('260    ‡aLondon,‡c1962.'));
    
    record2.appendField(Utils.stringToField('008    901016s1962^^^^xx^|||||||||||||||||eng||'));
    record2.appendField(Utils.stringToField('020    ‡a0-521-09711-8'));
    record2.appendField(Utils.stringToField('260    ‡aCambridge :‡bCambridge Univ. Pr.,‡c1962.'));
    
    expect(runExtractor()).to.eql(null);
  });

  it('should return null if isbns and publishers match', () => {
    
    record1.appendField(Utils.stringToField('008    890915s1972^^^^xxk|||||||||||||||||eng||'));
    record1.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    record1.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    
    record2.appendField(Utils.stringToField('008    901016s1972^^^^xx^|||||||||||||||||eng||'));
    record2.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    
    expect(runExtractor()).to.eql(null);
  });

});