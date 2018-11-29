// @flow
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
const {MarcRecord} = require('@natlibfi/marc-record');

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
      {name: 'title'},
      {name: 'charsimilarity'},
      {name: 'author'},
      {name: 'years'}
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
