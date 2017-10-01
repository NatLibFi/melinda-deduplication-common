const chai = require('chai');
const expect = chai.expect;

const { Labels } = require('./constants');
const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const ISSN = require('./feature-ISSN');

describe('ISSN', function() {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();

  });

  describe('for records published after 1974', () => {

    beforeEach(() => {
      record1.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz||||||||||||||mul||'));
      record2.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz||||||||||||||mul||'));
    });

    it('should return null if either is missing ISSN', () => {
      
      record1.appendField(Utils.stringToField('022    ‡a1022-9299'));
    
      const extractor = ISSN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(null);
    });
  
    it('should return SURE for identical ISSNs', () => {
      
      record1.appendField(Utils.stringToField('022    ‡a1022-9299'));
      record2.appendField(Utils.stringToField('022    ‡a1022-9299'));
     
      
      const extractor = ISSN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(Labels.SURE);
    });


    it('should return SURE if other has the ISSN in y subfield (wrong issn)', () => {
      
      record1.appendField(Utils.stringToField('022    ‡a1022-9299'));
      record2.appendField(Utils.stringToField('022    ‡a1029-8649‡y1022-9299'));
     
      const extractor = ISSN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(Labels.SURE);
    });
  });

});