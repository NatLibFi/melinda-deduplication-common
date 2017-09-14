const chai = require('chai');
const expect = chai.expect;
const MarcRecord = require('marc-record-js');
const RecordUtils = require('./record-utils');

const { getLastModificationDate } = require('./marc-record-utils');

describe('marc-record-utils', function() {
  describe('getLastModificationDate', () => {
    let record;
    beforeEach(() => {
      record = new MarcRecord();

    });
    
    it('should parse the last modification date from 005', () => {
      record.fields.push(RecordUtils.stringToField('005    20170913132213.0'));
      const expectedDate = new Date(2017, 8, 13, 13, 22, 13);
      expect(getLastModificationDate(record)).to.eql(expectedDate);
    });


  });
});
