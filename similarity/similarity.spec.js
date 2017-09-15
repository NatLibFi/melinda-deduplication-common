const chai = require('chai');
const expect = chai.expect;
const MarcRecord = require('marc-record-js');

const Utils = require('./feature-extractors/utils');
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
      { 'name': 'author' },
      { 'name': 'years' }
    ];
    
    record1.appendField(Utils.stringToField('008    120201s2011^^^^fi^||||^^m^^^|00|^0|eng|^'));
    record1.appendField(Utils.stringToField('100    ‡aTekijä'));
    record1.appendField(Utils.stringToField('245    ‡aAsia, joka on painavaa eikä kovin yleinen sana'));
    
    record2.appendField(Utils.stringToField('008    120201s2011^^^^fi^||||^^m^^^|00|^0|eng|^'));
    record2.appendField(Utils.stringToField('100    ‡aTekijä'));
    record2.appendField(Utils.stringToField('245    ‡aAsia, joka on painavaa eikä kovin yleinen sana'));
    
    const features = Similarity.extractFeatures(strategy, record1, record2);

    expect(features).to.eql({ 
      title: 1,
      charsimilarity: 1,
      author: 1,
      years: 1
    });
  });

});