const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');

const normalizeFuncs = require('./core.normalize');

function gf(value) {
  return [{
    subfield: [
      {'_': value, '$': { 'code': 'a'}}
    ]
  }];
}


describe('Normalize functions', function() {

  // The field mocks have all other data left out, so there is only subfields.
  var testFields = [{
    subfield: [
      {'_': 'subfield-A content', '$': { 'code': 'a'}},
      {'_': 'subfield B-content', '$': { 'code': 'b'}},
    ]
  }];

  var testFields2 = [
    {
      subfield: [
        {'_': 'subfield-a-content', '$': { 'code': 'a'}},
        {'_': 'subfield-b-content', '$': { 'code': 'b'}},
      ]
    },{
      subfield: [
        {'_': 'subfield-a-content', '$': { 'code': 'a'}},
        {'_': 'subfield-b-content', '$': { 'code': 'b'}},
      ]
    }
  ];


  describe('toStringOfSubfieldData', function() {

    it('should turn fields into array of strings', function() {
      var testData = _.cloneDeep(testFields);

      expect(toStringOfSubfieldData(testData)).to.be.an('array');
    });


    it('2 subfields should turn into array of 2 elements', function() {
      var testData = _.cloneDeep(testFields);

      expect(toStringOfSubfieldData(testData)).to.have.length(2);
    });
    

    it('2 fields with 2 subfields should turn into array of 4 elements.', function() {
      var testData = _.cloneDeep(testFields2);

      expect(toStringOfSubfieldData(testData)).to.have.length(4);
    });

    it('should have the content of subfield as values', function() {
      var testData = _.cloneDeep(testFields);

      expect(toStringOfSubfieldData(testData)).to.include('subfield-A content');
      expect(toStringOfSubfieldData(testData)).to.include('subfield B-content');

    });

  });

  describe('lowercase', function() {
    var lowercase = normalizeFuncs.lowercase;
  
    it('should return an array of lowercase versions', function() {
      var testData = _.cloneDeep(testFields);
    
      expect(lowercase(toStringOfSubfieldData(testData))).to.include('subfield-a content');
      expect(lowercase(toStringOfSubfieldData(testData))).to.include('subfield b-content');

    });

  });

  describe('join', function() {
    var join = normalizeFuncs.join;
   
    it('should join an array into single string', function() {
      var testData = _.cloneDeep(testFields);
      expect(join(toStringOfSubfieldData(testData))).to.equal('subfield-A contentsubfield B-content');
    });
  });

  describe('delChars', function() {
    var delChars = normalizeFuncs.delChars;
    
    it('should remove all spaces from array elements', function() {
      var testData = _.cloneDeep(testFields);
      expect(toStringOfSubfieldData(delChars(' ')(testData))).to.include('subfield-Acontent');
      expect(toStringOfSubfieldData(delChars(' ')(testData))).to.include('subfieldB-content');
    });
  });

  describe('utf8norm', function() {

    //nfc=Canonical Decomposition, followed by Canonical Composition
    it('should normalize utf8 characters to nfc', function() {
      expect( toStringOfSubfieldData(normalizeFuncs.utf8norm(gf('ÁÑ'))) ).to.include('ÁÑ');
    });
  });

  describe('removediacs', function() {
    it('should remove diacritics from string in utf8-nfc from', function() {
      expect( toStringOfSubfieldData(normalizeFuncs.removediacs(gf('ÁÑ'))) ).to.include('AN');
    });
  });

  describe('toSpace', function() {
    it('should change - to space', function() {
      expect( toStringOfSubfieldData(normalizeFuncs.toSpace('-')(gf('AB-CD'))) ).to.include('AB CD');
    });
  });

});

function toStringOfSubfieldData(fields) {
  
  var subfields = [];
  fields.forEach(function(field) {
    var data = _.map(field.subfield, '_');
    subfields = subfields.concat(data);
  });
  return subfields;
}
