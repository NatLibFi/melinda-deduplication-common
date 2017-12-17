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

const _ = require('lodash');
const debug = require('debug')('marc-merge-check');

const MergeValidation = require('./../marc-record-merge-utils/marc-record-merge-validate-service');

const MergeabilityClass = {
  NOT_MERGEABLE: 'NOT_MERGEABLE',
  MANUALLY_MERGEABLE: 'MANUALLY_MERGEABLE',
  AUTOMATICALLY_MERGEABLE: 'AUTOMATICALLY_MERGEABLE'
};

function handleValidationError(error) {
  if (error.name === 'MergeValidationError') {
    debug(error.message);
    debug(error.failureMessages);
    return false;
  }
  throw error;
}

async function validatePair(validationSet, preferredRecord, otherRecord) {
  try {
    const result = await MergeValidation.validateMergeCandidates(validationSet, preferredRecord, otherRecord);
    return result.valid === true;
  } catch(error) {
    return handleValidationError(error);
  }
}

const isMergeable = _.curry(validatePair)(MergeValidation.preset.melinda_host);
const isMergeableAutomatically = _.curry(validatePair)(MergeValidation.preset.melinda_host_automerge);

async function checkMergeability(preferredRecord, otherRecord) {

  if (await isMergeable(preferredRecord, otherRecord)) {
    if (await isMergeableAutomatically(preferredRecord, otherRecord)) {
      return MergeabilityClass.AUTOMATICALLY_MERGEABLE;
    } else {
      return MergeabilityClass.MANUALLY_MERGEABLE;
    }
  }

  return MergeabilityClass.NOT_MERGEABLE;
}

async function checkSubrecordMergeability({ preferredSubrecords, otherSubrecords }) {

  // neither or either has subrecords
  if (preferredSubrecords.length === 0 || otherSubrecords.length === 0) {
    return true;
  }

  // both have subrecords
  if (preferredSubrecords.length === otherSubrecords.length) {
    return true;
  }
  
  return false;
}

module.exports = {
  checkMergeability,
  MergeabilityClass,
  checkSubrecordMergeability
};
