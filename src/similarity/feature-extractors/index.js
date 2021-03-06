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

const AdditionalPhysicalForm = require('./feature-AdditionalPhysicalForm');
const EAN = require('./feature-EAN');
const F007 = require('./feature-F007');
const F008 = require('./feature-F008');
const F010 = require('./feature-F010');
const F015 = require('./feature-F015');
const F027 = require('./feature-F027');
const F041 = require('./feature-F041');
const ISBN = require('./feature-ISBN');
const ISBNextra = require('./feature-ISBNextra');
const ISMN = require('./feature-ISMN');
const ISRC = require('./feature-ISRC');
const ISRN = require('./feature-ISRN');
const ISSN = require('./feature-ISSN');
const MISC024 = require('./feature-MISC024');
const SICI = require('./feature-SICI');
const UPC = require('./feature-UPC');
const author = require('./feature-author');
const author245c = require('./feature-author245c');
const charsimilarity = require('./feature-charsimilarity');
const has880 = require('./feature-has880');
const publisher = require('./feature-publisher');
const reprint = require('./feature-reprint');
const sarjat = require('./feature-sarjat');
const size = require('./feature-size');
const title = require('./feature-title');
const years = require('./feature-years');
const format = require('./feature-format');
const F337_F338 = require('./feature-F337-F338');
const subjectAccessTerms = require('./feature-subject-access-terms');
const bundleNote = require('./feature-bundle-note');
const stopConditions = require('./feature-stop-conditions');
const F362 = require('./feature-F362');
const F028 = require('./feature-F028');
const TermsInFields = require('./feature-terms-in-fields');

module.exports = {
  AdditionalPhysicalForm,
  EAN,
  F007,
  F008,
  F010,
  F015,
  F027,
  ISBN,
  ISBNextra,
  ISMN,
  ISRC,
  ISRN,
  ISSN,
  MISC024,
  SICI,
  UPC,
  author,
  author245c,
  charsimilarity,
  has880,
  publisher,
  reprint,
  sarjat,
  size,
  title,
  years,
  format,
  F337_F338,
  subjectAccessTerms,
  bundleNote,
  F041,
  stopConditions,
  F362,
  F028,
  TermsInFields
};
