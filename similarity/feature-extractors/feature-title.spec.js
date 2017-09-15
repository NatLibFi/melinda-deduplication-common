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
  
    record1.appendField(Utils.stringToField('245    ‡aAsia Traktori Hiuslakka'));
    record2.appendField(Utils.stringToField('245    ‡aAsia Traktori Hiuslakka'));

    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.SURE);
  });

  it('should return null for titles with only stopwords', () => {
  
    record1.appendField(Utils.stringToField('245    ‡aAsia'));
    record2.appendField(Utils.stringToField('245    ‡aAsia Traktori Hiuslakka'));

    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(null);
  });
  

  it('should return SURELY_NOT for titles with different numbers in a-subfield', () => {

    record1.appendField(Utils.stringToField('245 10 ‡aSotkamon Hyvösiä II /‡cAssar Hyvönen ; [valokuvat: Assar Hyvönen].'));
    record2.appendField(Utils.stringToField('245 10 ‡aSotkamon Hyvösiä /‡cAssar Hyvönen.'));

    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.SURELY_NOT);
  });

  it('should return SURELY_NOT for titles with different numbers in b-subfield', () => {
    record1.appendField(Utils.stringToField('245 10 ‡aSotkamon Hyvösiä ‡bTää on joku juttu [2]/‡cAssar Hyvönen ; [valokuvat: Assar Hyvönen].'));
    record2.appendField(Utils.stringToField('245 10 ‡aSotkamon Hyvösiä ‡bTää on joku juttu /‡cAssar Hyvönen.'));

    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.SURELY_NOT);
  });

  it('should return ABSOLUTELY_NOT_DOUBLE for titles with different numbers in n-subfield', () => {
    record1.appendField(Utils.stringToField('245 00 ‡aSystems of innovation :‡bgrowth, competitiveness and employment.‡nVol. 2 /‡cedited by Charles Edquist and Maureen McKelvey.'));
    record2.appendField(Utils.stringToField('245 00 ‡aSystems of innovation :‡bgrowth, competitiveness and employment /‡cedited by Charles Edquist and Maureen McKelvey.'));
    
    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.ABSOLUTELY_NOT_DOUBLE);
  });

  it('should return ABSOLUTELY_NOT_DOUBLE for titles with different numbers in n-subfield', () => {
    record1.appendField(Utils.stringToField('245 00 ‡aEmployment.‡nVol. 2'));
    record2.appendField(Utils.stringToField('245 00 ‡aEmployment.‡nVol. 3'));
    
    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();
    
    expect(featureValue).to.equal(Labels.ABSOLUTELY_NOT_DOUBLE);
  });

  it('should return SURE for titles with special characters that are normalized away', () => {
    record1.appendField(Utils.stringToField('245 00 ‡aAdobe Premiere® Elements 10 :‡bclassroom in a book® : the official training workbook from Adobe'));
    record2.appendField(Utils.stringToField('245 00 ‡aAdobe Premiere Elements 10 :‡bclassroom in a book : the official training workbook from Adobe'));
    
    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
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