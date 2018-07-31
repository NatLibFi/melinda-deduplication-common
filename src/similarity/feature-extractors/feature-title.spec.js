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
const MarcRecord = require('marc-record-js');

const Utils = require('./utils');
const {Labels} = require('./constants');
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

  it('should not remove any stopwords if title contains only stopwords', () => {
    record1.appendField(Utils.stringToField('245    ‡aKehittäminen'));
    record2.appendField(Utils.stringToField('245    ‡aData'));

    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();

    expect(featureValue).to.equal(Labels.ABSOLUTELY_NOT_DOUBLE);
  });

  it('should return ABSOLUTELY_NOT_DOUBLE for titles with different numbers in a-subfield', () => {
    record1.appendField(Utils.stringToField('245 10 ‡aSotkamon Hyvösiä II /‡cAssar Hyvönen ; [valokuvat: Assar Hyvönen].'));
    record2.appendField(Utils.stringToField('245 10 ‡aSotkamon Hyvösiä /‡cAssar Hyvönen.'));

    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();

    expect(featureValue).to.equal(Labels.ABSOLUTELY_NOT_DOUBLE);
  });

  it('should return ABSOLUTELY_NOT_DOUBLE for titles with different numbers in b-subfield', () => {
    record1.appendField(Utils.stringToField('245 10 ‡aSotkamon Hyvösiä ‡bTää on joku juttu [2]/‡cAssar Hyvönen ; [valokuvat: Assar Hyvönen].'));
    record2.appendField(Utils.stringToField('245 10 ‡aSotkamon Hyvösiä ‡bTää on joku juttu /‡cAssar Hyvönen.'));

    const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
    expect(extractor).not.to.be.null;

    const featureValue = extractor.check();

    expect(featureValue).to.equal(Labels.ABSOLUTELY_NOT_DOUBLE);
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

  it('should return ABSOLUTELY_NOT_DOUBLE for strings in p-subfield', () => {
    record1.appendField(Utils.stringToField('245 00 ‡aCountry profile.‡pArgentina /‡cEconomist Intelligence Unit.'));
    record2.appendField(Utils.stringToField('245 00 ‡aCountry profile.‡pNamibia, Botswana, Lesotho, Swaziland /‡cThe Economist Intelligence Unit.'));

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

  describe('should return ABSOLUTELY_NOT_DOUBLE for different titles with somewhat common terms', () => {
    function primeRecords(strForRec1, strForRec2) {
      record1.appendField(Utils.stringToField(strForRec1));
      record2.appendField(Utils.stringToField(strForRec2));
    }

    function runExtractor() {
      const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
      expect(extractor).not.to.be.null;

      return extractor.check();
    }

    it('test a', () => {
      primeRecords(
        '245 00 ‡aThe corporation and the economy.',
        '245 00 ‡aThe corporation, ethics and the environment /‡ced. by W. Michael Hoffman, Robert Frederick and Edward S. Petry.'
      );
      expect(runExtractor()).to.equal(Labels.ABSOLUTELY_NOT_DOUBLE);
    });
    it('test b', () => {
      primeRecords(
        '245 10 ‡aEssentials of investments /‡cZvi Bodie, Alex Kane, Alan J. Marcus.',
        '245 10 ‡aStudent solutions manual for investments /‡cZvi Bodie, Alex Kane, Alan Marcus ; Prepared by Nicholas Racculia.'
      );
      expect(runExtractor()).to.equal(Labels.ABSOLUTELY_NOT_DOUBLE);
    });
    it('test c', () => {
      primeRecords(
        '245 00 ‡aKantian theory and human rights /‡cedited by Andreas Føllesdal and Reidar Maliks.',
        '245 10 ‡aKantian thinking about military ethics /‡cJ. Carl Ficarrotta.'
      );
      expect(runExtractor()).to.equal(Labels.ABSOLUTELY_NOT_DOUBLE);
    });
    it('test d', () => {
      primeRecords(
        '245 00 ‡aKantian review.',
        '245 00 ‡aKantian thinking about military ethics /‡cJ. Carl Ficarrotta.'
      );
      expect(runExtractor()).to.equal(Labels.ABSOLUTELY_NOT_DOUBLE);
    });
  });

  describe('should not return SURELY_NOT for similar titles', () => {
    function primeRecords(strForRec1, strForRec2) {
      record1.appendField(Utils.stringToField(strForRec1));
      record2.appendField(Utils.stringToField(strForRec2));
    }

    function runExtractor() {
      const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
      expect(extractor).not.to.be.null;

      return extractor.check();
    }

    it('test a', () => {
      primeRecords(
        '245 10 ‡aMateriaalin valinta :‡bliukulaakerit.',
        '245 10 ‡aMateriaalivalinta - liukulaakerit.'
      );
      expect(runExtractor()).not.to.equal(Labels.SURELY_NOT);
    });

    it('test b', () => {
      primeRecords(
        '245 10 ‡aSuomi - järvien ja metsien maa =‡bFinland i bild = Finnland in Bildern /‡cMatti A. Pitkänen ; [svensk övers.: Lars Hamberg ; deutsche Übers.: Michael Knaup].',
        '245 10 ‡aSuomi :‡bjärvien ja metsien maa.'
      );
      expect(runExtractor()).not.to.equal(Labels.SURELY_NOT);
    });
  });

  describe('miscellaneous tests from actual data', () => {
    function primeRecords(strForRec1, strForRec2) {
      record1.appendField(Utils.stringToField(strForRec1));
      record2.appendField(Utils.stringToField(strForRec2));
    }

    function runExtractor() {
      const extractor = title(toWeirdFormat(record1), toWeirdFormat(record2));
      expect(extractor).not.to.be.null;

      return extractor.check();
    }

    it('it should return SURE if they are almost identical', () => {
      primeRecords(
        '245 10 ‡aEducation culture and politics in modern France /‡cW. D. Halls.',
        '245 10 ‡aEducation, culture and politics in modern France /‡cby W. D. Halls.'
      );
      expect(runExtractor()).to.equal(Labels.SURE);
    });

    it('it should return SURE if there are only minor differences', () => {
      primeRecords(
        '245 00 ‡aBibliotheca academica Helsingfors universitetsbibliotek :‡bFinlands nationalbibliotek /‡cred. Rainer Knapas.',
        '245 00 ‡aBibliotheca academica :‡bHelsingfors universitetsbibliotek /‡c[arbetsgrupp: Dorrit Gustafsson, Esko Häkli, Eija Vuori] ; [redaktion: Rainer Knapas] ; [översättning ... Rainer Knapas].'
      );
      expect(runExtractor()).to.equal(Labels.SURE);
    });

    it('it should return SURE if there are only minor differences', () => {
      primeRecords(
        '245 04 ‡aThe global competitiveness report 2001-2002 :‡bWorld Economic Forum, Geneva, Switzerland 2001 /‡cKlaus Schwab, Michawl E. Porter, Jeffery D. Sachs ; project leaders, Peter K. Cornelius, John W. McArthur.',
        '245 04 ‡aThe global competitiveness report 2001-2002 /‡cCentre for International Development ; Klaus Schwab ...[ja muita].'
      );
      expect(runExtractor()).to.equal(Labels.ABSOLUTELY_NOT_DOUBLE);
    });

    it('it should return SURE if there are only minor differences', () => {
      primeRecords(
        '245 00 ‡aSata vuotta suomalaisia viinejä ja liköörejä :‡b(Nordfors (Marli) 1867 3/5 1967) : Juhlakirja /‡cJulkaistu Nordforsin (Marlin) viini- ja likööritehtaan täyttäessä sata vuotta 3.5.1967 ; Toim. Eero Saarenheimo.',
        '245 00 ‡aSata vuotta suomalaisia viinejä ja liköörejä :‡bNordfors (Marli) 1867 3/5 1967 : juhlakirja julkaistu Nordforsin (Marlin) viini- ja likööritehtaan täyttäessä sata vuotta 3.5.1967 /‡ctoimittanut: Eero Saarenheimo.'
      );
      expect(runExtractor()).to.equal(Labels.SURE);
    });

    it('it should return SURE if there are only minor differences', () => {
      primeRecords(
        '245 00 ‡aTiernapojat :‡bVANHA JOULUKUVAELMA ; Mieskvartetille sovittanut Matti Apajalahti',
        '245 00 ‡aTiernapojat :‡bwanha joulukuvaelma /‡cdiskanttiäänille sovittanut Matti Apajalahti.'
      );
      expect(runExtractor()).to.equal(Labels.SURE);
    });
  });
});

function toWeirdFormat(record) {
  return {
    controlfield: record.getControlfields().map(convertControlField),
    datafield: record.getDatafields().map(convertDataField)
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
        ind2: field.ind2
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
