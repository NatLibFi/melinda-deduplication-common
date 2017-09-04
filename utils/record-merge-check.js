const _ = require('lodash');
const debug = require('debug')('marc-merge-check');

const MergeValidation = require('melinda-deduplication-common/marc-record-merge-utils/marc-record-merge-validate-service');

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

module.exports = {
  checkMergeability,
  MergeabilityClass  
};
