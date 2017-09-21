const chai = require('chai');
const expect = chai.expect;

const { Labels } = require('./constants');
const { SURE, SURELY_NOT, ALMOST_SURE } = Labels;

const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const subjectAccessTerms = require('./feature-subject-access-terms');

describe('subjectAccessTerms', function() {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();

    record1.leader = '^^^^^ccm^a22004934i^4500';
    record2.leader = '^^^^^ccm^a22004934i^4500';

  });

  function runExtractor() {
    
    const extractor = subjectAccessTerms(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    return extractor.check();
  }

  it('should return null if either record is missing the field', () => {

    record1.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    expect(runExtractor()).to.eql(null);

  });

  it('should return SURE if both records have identical set of terms', () => {
    
    record1.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    record1.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    
    record2.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    
    expect(runExtractor()).to.eql(SURE);
  });
        

  it('should return SURELY_NOT for if sets are totally different', () => {
    
    record1.appendField(Utils.stringToField('650  7 ‡aatodennäköisyyslaskenta‡2ysa'));    
    record2.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    
    expect(runExtractor()).to.eql(SURELY_NOT);

  });

  it('should return proportion of same terms if sets are overlapping', () => {
    
    record1.appendField(Utils.stringToField('650  7 ‡aatodennäköisyyslaskenta‡2ysa'));    
    record1.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    record1.appendField(Utils.stringToField('650  7 ‡averkostot‡2ysa'));
    
    record2.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡averkostot‡2ysa'));
    
    expect(runExtractor()).to.eql(2/3);

  });

  it('should return ALMOST_SURE if other set is subset', () => {
    
    record1.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    
    record2.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡averkostot‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡apörssiyhtiöt‡2ysa'));
    
    expect(runExtractor()).to.eql(ALMOST_SURE);

  });

});