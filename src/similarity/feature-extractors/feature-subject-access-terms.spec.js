/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Shared modules for microservices of Melinda deduplication system
 *
 * Copyright (c) 2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-deduplication-common
 *
 * melinda-deduplication-common is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * melinda-deduplication-common is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 **/

const chai = require('chai');
const expect = chai.expect;

const { Labels } = require('./constants');
const { SURE, SURELY_NOT, ALMOST_SURE } = Labels;

const MarcRecord = require('marc-record-js');
const Utils = require('./utils');

const subjectAccessTerms = require('./feature-subject-access-terms');

describe('subjectAccessTerms', function() {

  let record1;
  let record2;

  beforeEach(() => {  
    record1 = new MarcRecord();
    record2 = new MarcRecord();

    record1.leader = '^^^^^ccm^a22004934i^4500';
    record2.leader = '^^^^^ccm^a22004934i^4500';

  });

  function runExtractor() {
    
    const extractor = subjectAccessTerms(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    return extractor.check();
  }

  it('should return null if either record is missing the field', () => {

    record1.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    expect(runExtractor()).to.eql(null);

  });

  it('should return SURE if both records have identical set of terms', () => {
    
    record1.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    record1.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    
    record2.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    
    expect(runExtractor()).to.eql(SURE);
  });
        

  it('should return SURELY_NOT for if sets are totally different', () => {
    
    record1.appendField(Utils.stringToField('650  7 ‡aatodennäköisyyslaskenta‡2ysa'));    
    record2.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    
    expect(runExtractor()).to.eql(SURELY_NOT);

  });

  it('should return proportion of same terms if sets are overlapping', () => {
    
    record1.appendField(Utils.stringToField('650  7 ‡aatodennäköisyyslaskenta‡2ysa'));    
    record1.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    record1.appendField(Utils.stringToField('650  7 ‡averkostot‡2ysa'));
    
    record2.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡averkostot‡2ysa'));
    
    expect(runExtractor()).to.eql(2/3);

  });

  it('should return ALMOST_SURE if other set is subset', () => {
    
    record1.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    
    record2.appendField(Utils.stringToField('650  7 ‡amarkkinointi‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡astrategia‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡averkostot‡2ysa'));
    record2.appendField(Utils.stringToField('650  7 ‡apörssiyhtiöt‡2ysa'));
    
    expect(runExtractor()).to.eql(ALMOST_SURE);

  });

});