const chai = require('chai');
const expect = chai.expect;

const { Labels } = require('./constants');
const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const ISBN = require('./feature-ISBN');

describe('ISBN', function() {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();

  });

  describe('for records published after 1971', () => {

    beforeEach(() => {
      record1.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz||||||||||||||mul||'));
      record2.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz||||||||||||||mul||'));
    });

    it('should return null if either is missing ISBN', () => {
      
      record1.appendField(Utils.stringToField('020    ‡a951-643-753-2'));
    
      const extractor = ISBN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(null);
    });

    it('should return SURE for identical ISBNs', () => {
      
      record1.appendField(Utils.stringToField('020    ‡a951-643-753-2'));
      record2.appendField(Utils.stringToField('020    ‡a951-643-753-2'));
      
      const extractor = ISBN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(Labels.SURE);
    });

    it('should return SURE for identical ISBNs when other is in z subfield', () => {
      record1.appendField(Utils.stringToField('020    ‡a951-643-753-2'));
      record2.appendField(Utils.stringToField('020    ‡z951-643-753-2'));
      
      const extractor = ISBN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(Labels.SURE);
    });

    it('should return SURE for identical ISBNs when other is in short format', () => {
      record1.appendField(Utils.stringToField('020    ‡a978951-643-7531'));
      record2.appendField(Utils.stringToField('020    ‡a951-643-753-2'));
      
      const extractor = ISBN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(Labels.SURE);
    });

    it('should return MAYBE for intersecion of ISBNs', () => {
      record1.appendField(Utils.stringToField('020    ‡a978951-643-7531'));
      record1.appendField(Utils.stringToField('020    ‡a978951-643-7777'));
      
      record2.appendField(Utils.stringToField('020    ‡a951-643-753-2'));
      record2.appendField(Utils.stringToField('020    ‡a978951-643-6666'));
      
      const extractor = ISBN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(Labels.MAYBE);
    });

    it('should return SURE for isbns ending in X', () => {
      record1.appendField(Utils.stringToField('020    ‡a978-0-7680-5723-2'));
      record2.appendField(Utils.stringToField('020    ‡a0-7680-5723-X'));

      const extractor = ISBN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(Labels.SURE);
    });

    it('should return SURE for incorrect check-digit', () => {
      record1.appendField(Utils.stringToField('020    ‡a978-0-7680-5723-2'));
      record2.appendField(Utils.stringToField('020    ‡a978-0-7680-5723-3'));
      
      const extractor = ISBN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
      const label = extractor.check();

      expect(label).to.equal(Labels.SURE);
    });

  });

  it('should return null for records that are older than 1972', () => {
    record1.appendField(Utils.stringToField('008    010608s1971^^^^fi^ppz||||||||||||||mul||'));
    record1.appendField(Utils.stringToField('020    ‡a978951-643-7531'));
    
    record2.appendField(Utils.stringToField('008    010608s1971^^^^fi^ppz||||||||||||||mul||'));
    record2.appendField(Utils.stringToField('020    ‡a951-643-753-2'));
    
    const extractor = ISBN(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const label = extractor.check();

    expect(label).to.equal(null);
  });


});