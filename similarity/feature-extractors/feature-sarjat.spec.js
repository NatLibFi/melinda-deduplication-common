const chai = require('chai');
const expect = chai.expect;
const MarcRecord = require('marc-record-js');

const Utils = require('./utils');
const { Labels } = require('./constants');
const sarjat = require('./feature-sarjat');

describe('feature-sarjat', () => {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();
  });

  it('should return SURE for identical series', () => {
  
    record1.appendField(Utils.stringToField('830  0 ‡aNord,‡x0903-7004 ;‡v1992, 4.'));
    record2.appendField(Utils.stringToField('830  0 ‡aNord,‡x0903-7004 ;‡v1992, 4.'));
    
    const extractor = sarjat(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.SURE);
  });

  it('should return SURE for series that are same after normalization', () => {
  
    record1.appendField(Utils.stringToField('830  0 ‡aNord ;‡v1992, 24.'));  
    record2.appendField(Utils.stringToField('830  0 ‡aNORD ;‡v1992:24.'));

    const extractor = sarjat(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.SURE);
  });

  it('should return MAYBE for series where only either has x subfield', () => {
  
    record1.appendField(Utils.stringToField('830  0 ‡aNord,‡x0903-7004 ;‡v1992, 24.'));  
    record2.appendField(Utils.stringToField('830  0 ‡aNORD ;‡v1992:24.'));

    const extractor = sarjat(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.MAYBE);
  });
  
  it('should return SURELY_NOT for series where with different x', () => {
  
    record1.appendField(Utils.stringToField('830  0 ‡aNord,‡x0903-7224 ;‡v1992, 24.'));  
    record2.appendField(Utils.stringToField('830  0 ‡aNord,‡x0903-7004 ;‡v1992, 24.'));  
    
    const extractor = sarjat(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.SURELY_NOT);
  });


  it('should return SURELY_NOT for series where with same and different series', () => {
  
    record1.appendField(Utils.stringToField('830  0 ‡aNord,‡x0903-7224 ;‡v1992, 24.'));  
    record1.appendField(Utils.stringToField('830  0 ‡aNord,‡x0903-9994 ;‡v1992, 24.'));  

    record2.appendField(Utils.stringToField('830  0 ‡aNord,‡x0903-7224 ;‡v1992, 24.'));  
    record2.appendField(Utils.stringToField('830  0 ‡aNord,‡x0903-7004 ;‡v1992, 24.'));  
    
    const extractor = sarjat(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.SURELY_NOT);
  });

  it('should return SURE for series where sets of x subfields are identical', () => {
  
    [
      '490 1  ‡aYleislääketiede, Tutkimuksia,‡x1237-9883 ;‡v1994, 2',
      '490 1  ‡aOulun yliopisto. Yleislääketiede, tutkimus,‡x1237-9883 ;‡v2/1994',
      '490 1  ‡aYleislääketiede, Tutkimus,‡x1237-9883 ;‡v2',
      '490 1  ‡aYleislääketiede, Tutkimus,‡x1237-9883 ;‡v1994, 2',
    ].forEach(str => record1.appendField(Utils.stringToField(str)));

    [
      '490 1  ‡aYleislääketiede / Oulun yliopisto, kansanterveystieteen ja yleislääketieteen laitos, Tutkimus,‡x1237-9883 ;‡v2/1994',
      '830  0 ‡aYleislääketiede / Oulun yliopisto, kansanterveystieteen ja yleislääketieteen laitos,‡pTutkimus,‡x1237-9883 ;‡v2/1994.'
    ].forEach(str => record2.appendField(Utils.stringToField(str)));
    
    const extractor = sarjat(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.SURE);
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