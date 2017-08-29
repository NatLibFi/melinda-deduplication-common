const chai = require('chai');
const expect = chai.expect;
const MarcRecord = require('marc-record-js');

const Utils = require('./utils');
const { Labels } = require('./constants');
const title = require('./feature-title');

describe('title', () => {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();
  });

  it('should return SURE for identical titles', () => {
  
    record1.appendField(Utils.stringToField('245    ‡aAsia'));
    record2.appendField(Utils.stringToField('245    ‡aAsia'));

    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.SURE);
  });

  it('should return SURELY_NOT for titles with different numbers in them', () => {

    record1.appendField(Utils.stringToField('245 10 ‡aSotkamon Hyvösiä II /‡cAssar Hyvönen ; [valokuvat: Assar Hyvönen].'));
    record2.appendField(Utils.stringToField('245 10 ‡aSotkamon Hyvösiä /‡cAssar Hyvönen.'));

    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.SURELY_NOT);
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