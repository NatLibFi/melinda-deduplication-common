const chai = require('chai');
const expect = chai.expect;

const { Labels } = require('./constants');
const { SURE, SURELY_NOT, ABSOLUTELY_NOT_DOUBLE } = Labels;

const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const createExtractor = require('./feature-terms-in-fields');

describe('feature-terms-in-fields', function() {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();
  });

  function primeRecords(strForRec1, strForRec2) {
    strForRec1 && record1.appendField(Utils.stringToField(strForRec1));
    strForRec2 && record2.appendField(Utils.stringToField(strForRec2));
  }

  function runExtractor() {

    const extractor = createExtractor(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    return extractor.check();
  }

  it('should return SURE for records with same instrumentation terms', () => {
    primeRecords(
      '500    ‡aSoitinnus: lauluääni, piano.',
      '500    ‡aSoitinnus: lauluääni, piano.'
    );
    expect(runExtractor()[0]).to.eql(SURE);
  });

  it('should return SURE for records with subset of instrumentation terms', () => {
    primeRecords(
      '500    ‡aSoitinnus: piano.',
      '500    ‡aSoitinnus: lauluääni, piano.'
    );
    expect(runExtractor()[0]).to.eql(SURE);
  });

  it('should return SURELY_NOT for records with different instrumentation terms', () => {
    primeRecords(
      '500    ‡aMieskuoro',
      '500    ‡aNais- ja lapsikuoro'
    );
    expect(runExtractor()[0]).to.eql(SURELY_NOT);
  });

  it('should return null for records without any instrumentation terms', () => {
    primeRecords(
      '500    ‡aLisäpainokset: 2. 2012',
      '500    ‡aNais- ja lapsikuoro'
    );
    expect(runExtractor()[0]).to.eql(null);
  });

  it('should return SURELY_NOT for records where other has pro gradu in it', () => {
    primeRecords(
      '509    ‡apro gradu',
      '500    ‡amoniste'
    );
    expect(runExtractor()[1]).to.eql(ABSOLUTELY_NOT_DOUBLE);
  });

  it('should return SURELY_NOT for records where other has väitöskirja in it', () => {
    primeRecords(
      '502    ‡aväitöskirja',
      '500    ‡amoniste'
    );
    expect(runExtractor()[1]).to.eql(ABSOLUTELY_NOT_DOUBLE);
  });
  it('should return SURE if both records have väitöskirja in it', () => {
    primeRecords(
      '502    ‡aväitöskirja',
      '502    ‡aväitöskirja'
    );
    expect(runExtractor()[1]).to.eql(SURE);
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