const chai = require('chai');
const expect = chai.expect;
const MarcRecord = require('marc-record-js');

const Utils = require('./utils');
const { Labels } = require('./constants');
const Similarity = require('./similarity');

describe('similarity', () => {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();
  });

  it('should extract features based on strategy', () => {

    const strategy = [
      { 'name': 'title' },
      { 'name': 'charsimilarity' },
      { 'name': 'author' }
    ];
    
    record1.appendField(Utils.stringToField('100    ‡aTekijä'));
    record1.appendField(Utils.stringToField('245    ‡aAsia'));
    
    record2.appendField(Utils.stringToField('100    ‡aTekijä'));
    record2.appendField(Utils.stringToField('245    ‡aAsia'));
    
    const similarity = new Similarity(strategy);
    const features = similarity.extractFeatures(record1, record2);

    expect(features).to.eql({ 
      title: 1,
      charsimilarity: 1,
      author: 1
    });
  });

});