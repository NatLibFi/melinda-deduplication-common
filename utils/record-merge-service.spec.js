const chai = require('chai');
const expect = chai.expect;

const mergeConfiguration = require('../default-configs/merge-config');
const componentRecordMatcherConfiguration = require('../default-configs/component-record-similarity-definition.js');

const { createRecordMergeService, MergeabilityClass } = require('./record-merge-service');

describe('record-merge-service', function() {

  let recordMergeService;

  beforeEach(() => {

    recordMergeService = createRecordMergeService(mergeConfiguration, componentRecordMatcherConfiguration)
  });

});
