const chai = require('chai');
const expect = chai.expect;

const { Labels } = require('./constants');
const { SURE, SURELY_NOT } = Labels;

const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const F337_F338 = require('./feature-F337-F338');

describe('F337_F338', function() {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();

    record1.leader = '^^^^^ccm^a22004934i^4500';
    record2.leader = '^^^^^ccm^a22004934i^4500';

  });

  function runExtractor() {
    
    const extractor = F337_F338(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    return extractor.check();
  }

  it('should return null if either record is missing the field', () => {

    record1.appendField(Utils.stringToField('337    ‡akäytettävissä ilman laitetta‡bn‡2rdamedia'));
    record2.appendField(Utils.stringToField('338    ‡anide‡bnc‡2rdacarrier'));
    
    expect(runExtractor()).to.eql([null, null]);
  });

  it('should return SURE for same values', () => {

    record1.appendField(Utils.stringToField('337    ‡akäytettävissä ilman laitetta‡bn‡2rdamedia'));
    record1.appendField(Utils.stringToField('338    ‡anide‡bnc‡2rdacarrier'));

    record2.appendField(Utils.stringToField('337    ‡akäytettävissä ilman laitetta‡bn‡2rdamedia'));
    record2.appendField(Utils.stringToField('338    ‡anide‡bnc‡2rdacarrier'));

    expect(runExtractor()).to.eql([SURE, SURE]);
  });
        

  it('should return SURELY_NOT for different values', () => {
    
    record1.appendField(Utils.stringToField('337    ‡akäytettävissä ilman laitetta‡bn‡2rdamedia'));
    record1.appendField(Utils.stringToField('338    ‡anide‡bnc‡2rdacarrier'));

    record2.appendField(Utils.stringToField('337    ‡atietokonekäyttöinen‡bc‡2rdamedia '));
    record2.appendField(Utils.stringToField('338    ‡averkkoaineisto‡bcr‡2rdacarrier'));
    
    expect(runExtractor()).to.eql([SURELY_NOT, SURELY_NOT]);

  });


});