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

import path from 'path';
import fs from 'fs';

const chai = require('chai');

const expect = chai.expect;
const MarcRecord = require('marc-record-js');
const _ = require('lodash');
const PostMerge = require('../marc-record-merge-utils/marc-record-merge-postmerge-service');

const mergeConfiguration = require('../default-configs/merge-config');
const componentRecordMatcherConfiguration = require('../default-configs/component-record-similarity-definition.js');

const {createRecordMergeService} = require('./record-merge-service');

const TEST_CASE_SEPARATOR = '\n\n\n\n';

const storiesPath = path.resolve(__dirname, './record-merge-service-stories/');

describe('record-merge-service', () => {
  let recordMergeService;

  beforeEach(() => {
    recordMergeService = createRecordMergeService(mergeConfiguration, componentRecordMatcherConfiguration);
  });

  const files = fs.readdirSync(storiesPath);
  const storyFiles = files.filter(filename => filename.substr(-6) === '.story').sort();

  storyFiles.map(loadStoriesFromFile).forEach(testSuite => {
    describe(testSuite.suiteName, () => {
      testSuite.testCases.forEach(testCase => {
        const itFn = testCase.testName.startsWith('!') ? it.only : it;

        itFn(testCase.testName, async () => {
          const postMergeFixes = _.without(PostMerge.preset.defaults, PostMerge.add583NoteAboutMerge);

          const mergedRecordFamily = await recordMergeService.mergeRecords(testCase.preferredRecordFamily, testCase.otherRecordFamily, postMergeFixes);
          const mergedHost = mergedRecordFamily.record;

          expect(mergedHost.toString()).to.eql(testCase.expectedMergedRecordFamily.record.toString());
        });
      });
    });
  });
});

function loadStoriesFromFile(filename) {
  const storyText = fs.readFileSync(path.resolve(storiesPath, filename), 'utf8');

  const suiteName = filename.slice(0, -6);

  const testCases = parseStories(storyText);

  return {suiteName, testCases};
}

function parseStories(storyText) {
  return storyText.split(TEST_CASE_SEPARATOR)
    .map(story => story.trim())
    .map(story => {
      const lines = story.split('\n').map(line => line.trim());
      const testName = lines[0];
      const preferredRecordRaw = lines.slice(2, lines.indexOf('')).join('\n');
      const preferredRecord = MarcRecord.fromString(preferredRecordRaw);

      const preferredRecordFamily = {
        record: preferredRecord
      };

      const otherRecordStartIndex = lines.indexOf('Other record:') + 1;
      const otherRecordRaw = lines.slice(otherRecordStartIndex, lines.indexOf('', otherRecordStartIndex)).join('\n');
      const otherRecord = MarcRecord.fromString(otherRecordRaw);

      const otherRecordFamily = {
        record: otherRecord
      };

      const expectedMergedRecordStartIndex = lines.indexOf('Expected record after merge:') + 1;
      const expectedMergedRecordEndIndex = lines.indexOf('', expectedMergedRecordStartIndex) === -1 ? lines.length : lines.indexOf('', expectedMergedRecordStartIndex);
      const expectedMergedRecordRaw = lines.slice(expectedMergedRecordStartIndex, expectedMergedRecordEndIndex).join('\n');
      const expectedMergedRecord = MarcRecord.fromString(expectedMergedRecordRaw);

      const expectedMergedRecordFamily = {
        record: expectedMergedRecord
      };

      return {testName, preferredRecordFamily, otherRecordFamily, expectedMergedRecordFamily};
    });
}
