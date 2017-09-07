const chai = require('chai');
const expect = chai.expect;

const { Labels } = require('./constants');
const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const F007 = require('./feature-F007');

describe('F007', function() {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();

    record1.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz||||||||||||||mul||'));
    record2.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz||||||||||||||mul||'));
  });

  it('should return null if field is missing 007', () => {
    
    const extractor = F007(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const label = extractor.check();

    expect(label).to.equal(null);
  });

  it('should return SURE for identical 007', () => {
    record1.appendField(Utils.stringToField('007    |||||||||mul||'));
    record2.appendField(Utils.stringToField('007    |||||||||mul||'));

    const extractor = F007(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const label = extractor.check();

    expect(label).to.equal(Labels.SURE);
  });

  it('should return SURELY_NOT for different 007', () => {
    record1.appendField(Utils.stringToField('007    X||||||||mul||'));
    record2.appendField(Utils.stringToField('007    |||||||||mul||'));
    
    const extractor = F007(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const label = extractor.check();

    expect(label).to.equal(Labels.SURELY_NOT);
  });

});