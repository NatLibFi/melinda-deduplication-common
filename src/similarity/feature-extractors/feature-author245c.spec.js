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

const {Labels} = require('./constants');

const {SURE, SURELY_NOT, ALMOST_SURE} = Labels;

const {MarcRecord} = require('@natlibfi/marc-record');
const Utils = require('./utils');

const author245c = require('./feature-author245c');

describe('author245c', () => {
  let record1;
  let record2;

  beforeEach(() => {
    record1 = new MarcRecord();
    record2 = new MarcRecord();
    record1.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz||||||||||||||mul||'));
    record2.appendField(Utils.stringToField('008    010608s2000^^^^fi^ppz||||||||||||||mul||'));
  });

  it('should return null if field is missing 245c', () => {
    const extractor = author245c(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const label = extractor.check();

    expect(label).to.equal(null);
  });

  it('should return SURE for identical 245c', () => {
    record1.appendField(Utils.stringToField(
      '245 10 ‡aSidosryhmät ja riski pörssiyhtiössä.‡n[1] /‡cTimo Kaisanlahti.'
    ));
    record2.appendField(Utils.stringToField(
      '245 10 ‡aSidosryhmät ja riski pörssiyhtiössä /‡cTimo Kaisanlahti.'
    ));

    const extractor = author245c(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql(SURE);
  });

  it('should return ALMOST_SURE if other 245c is subset', () => {
    record1.appendField(Utils.stringToField(
      '245 10 ‡aSidosryhmät ja riski pörssiyhtiössä.‡n[1] /‡ckirjoittanut Timo Kaisanlahti.'
    ));
    record2.appendField(Utils.stringToField(
      '245 10 ‡aSidosryhmät ja riski pörssiyhtiössä /‡cTimo Kaisanlahti.'
    ));

    const extractor = author245c(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql(ALMOST_SURE);
  });

  it('should return ALMOST_SURE if other 245c is subset', () => {
    record1.appendField(Utils.stringToField(
      '245 10 ‡aSidosryhmät ja riski pörssiyhtiössä.‡n[1] /‡ctoimittanut Kullervo'
    ));
    record2.appendField(Utils.stringToField(
      '245 10 ‡aSidosryhmät ja riski pörssiyhtiössä /‡ctoim. Kullervo'
    ));

    const extractor = author245c(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql(ALMOST_SURE);
  });

  it('should return SURE if other 245c is abbreviated', () => {
    record1.appendField(Utils.stringToField(
      '245 14 ‡aThe prophet armed :‡bTrotsky: 1879-1921 /‡cIsaac Deutscher.'
    ));
    record2.appendField(Utils.stringToField(
      '245 14 ‡aThe prophet armed :‡bTrotsky: 1879-1921 /‡cI. Deutscher.'
    ));

    const extractor = author245c(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql(SURE);
  });

  it('should return SURE if there is a typo in 245c', () => {
    record1.appendField(Utils.stringToField(
      '245 10 ‡aSprachherkunftsforschung.‡nBand 1,‡pEinleitung und Phonogenese/Paläophonetik /‡cGyula Décsy.'
    ));
    record2.appendField(Utils.stringToField(
      '245 10 ‡aSprachherkunftsforschung.‡n1,‡pEinleitung und Phonogenese/Paläophonetik /‡cGuyla Décsy.'
    ));

    const extractor = author245c(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql(SURE);
  });

  it('should return ALMOST_SURE if there is some extra info in another 245c', () => {
    record1.appendField(Utils.stringToField(
      '245 00 ‡aVanhojen mestarien hartaita lauluja. ‡csovittanut = bearbetade av John Sundberg.'
    ));
    record2.appendField(Utils.stringToField(
      '245 00 ‡aVanhojen mestarien hartaita lauluja. ‡csovittanut John Sundberg.'
    ));

    const extractor = author245c(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql(ALMOST_SURE);
  });

  it('should return SURELY_NOT if 245c are different', () => {
    record1.appendField(Utils.stringToField(
      '245 10 ‡aSprachherkunftsforschung.‡nBand 1,‡pEinleitung und Phonogenese/Paläophonetik /‡cTest person'
    ));
    record2.appendField(Utils.stringToField(
      '245 10 ‡aSprachherkunftsforschung.‡n1,‡pEinleitung und Phonogenese/Paläophonetik /‡cGuyla Décsy.'
    ));

    const extractor = author245c(Utils.toxmljsFormat(record1), Utils.toxmljsFormat(record2));
    const labels = extractor.check();

    expect(labels).to.eql(SURELY_NOT);
  });
});

