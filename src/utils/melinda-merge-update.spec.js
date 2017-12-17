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

import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
const expect = chai.expect;
import { commitMerge, splitRecord } from './melinda-merge-update';
import * as RecordUtils from './record-utils';

import MarcRecord from 'marc-record-js';

describe('melinda merge update', function() {
  describe('commitMerge', function() {
    let clientStub;
    let base;

    beforeEach(() => {
      base = 'FIN01';
      clientStub = createClientStub();
    });

    it('requires that preferred main record has id', function(done) {

      const [preferred, other, merged, unmodified] = [createRecordFamily(), createRecordFamily(), createRecordFamily(), createRecordFamily()];

      commitMerge(clientStub, base, preferred, other, merged, unmodified)
        .then(expectFulfillmentToNotBeCalled(done))
        .catch(expectErrorMessage('Id not found for preferred record.', done));

    });

    it('requires that other main record has id', function(done) {

      const [preferred, other, merged, unmodified] = [createRandomRecordFamily(), createRecordFamily(), createRecordFamily(), createRecordFamily()];

      commitMerge(clientStub, base, preferred, other, merged, unmodified)
        .then(expectFulfillmentToNotBeCalled(done))
        .catch(expectErrorMessage('Id not found for other record.', done));

    });

    it('requires that preferred subrecords have ids', function(done) {

      const [preferred, other, merged, unmodified] = [createRandomRecordFamily(), createRandomRecordFamily(), createRecordFamily(), createRecordFamily()];

      preferred.subrecords[1].fields = preferred.subrecords[1].fields.filter(f => f.tag !== '001');

      commitMerge(clientStub, base, preferred, other, merged, unmodified)
        .then(expectFulfillmentToNotBeCalled(done))
        .catch(expectErrorMessage('Id not found for 2. subrecord from preferred record.', done));
        
    });

    it('returns metadata of successful operation', function(done) {
      const expectedRecordId = 15;

      clientStub.saveRecord.resolves('UPDATE-OK');
      clientStub.createRecord.resolves(createSuccessResponse(expectedRecordId));

      const [preferred, other, merged, unmodified] = [createRandomRecordFamily(), createRandomRecordFamily(), createRecordFamily(), createRecordFamily()];
  
      commitMerge(clientStub, base, preferred, other, merged, unmodified)
        .then(res => {
          expect(res).not.to.be.undefined;
          expect(res.recordId).to.equal(expectedRecordId);
          done();
        })
        .catch(done);

    });
  });

  describe('splitRecord', () => {
    let clientStub;
    let base;

    const mergedHostId = '009702404';
    const familyAHostId = '009702403';
    const familyBHostId = '009702402';
    let familyA, familyB, familyMerged;

    beforeEach(() => {
      base = 'FIN01';
      clientStub = createClientStub();

      [familyA, familyB, familyMerged] = [createRecordFamily(familyAHostId), createRecordFamily(familyBHostId), createRecordFamily(mergedHostId)];

      familyA.subrecords.push(createRandomComponentRecord(familyAHostId));
      familyB.subrecords.push(createRandomComponentRecord(familyBHostId));

      const mergedFamilyComponentRecord = createRandomComponentRecord(mergedHostId);
      familyMerged.subrecords.push(mergedFamilyComponentRecord);

      markAsDeleted(familyA);
      markAsDeleted(familyB);

      const setupLoadRecordStub = (record) => {
        const id = RecordUtils.selectRecordId(record);
        clientStub.loadRecord.withArgs(base, id).resolves(record);
      };
     
      const setupSaveRecordStub = (record) => {
        const id = RecordUtils.selectRecordId(record);
        clientStub.saveRecord.withArgs(base, id).resolves(createSuccessResponse(id));
      };
     
      [familyA, familyB, familyMerged].forEach(family => {
        setupLoadRecordStub(family.record);
        family.subrecords.forEach(setupLoadRecordStub);
        setupSaveRecordStub(family.record);
        family.subrecords.forEach(setupSaveRecordStub);
        
        const hostId = RecordUtils.selectRecordId(family.record);
        clientStub.loadSubrecords.withArgs(base, hostId).resolves(family.subrecords);        
      });

      
    });

    it('should not split component records', async () => {

      const componentRecordId = RecordUtils.selectRecordId(familyMerged.subrecords[0]);
   
      let error;
      try {
        await splitRecord(clientStub, base, componentRecordId);
      } catch(err) {
        error = err;
      }
      expect(error).to.be.an('Error');
      expect(error.message).to.contain(`Record (${base})${componentRecordId} is a component record.`, error.stack);

    });

    it('should not split deleted records', async () => {

      const recordId = RecordUtils.selectRecordId(familyMerged.record);
    
      markAsDeleted(familyMerged);

      let error;
      try {
        await splitRecord(clientStub, base, recordId);
      } catch(err) {
        error = err;
      }
      expect(error).to.be.an('Error');
      expect(error.message).to.contain(`Record (${base})${recordId} is deleted.`, error.stack);

    });

    it('should not split records that have not been merged previously', async () => {
      const recordId = '000000123';
      const record = createRecord(recordId);
      clientStub.loadRecord.withArgs(base, recordId).resolves(record);
      let error;
      try {
        await splitRecord(clientStub, base, recordId);
      } catch(err) {
        error = err;
      }
      expect(error).to.be.an('Error');
      expect(error.message).to.contain(`Record (${base})${recordId} does not have 583 field with merge metadata.`, error.stack);

    });

    it('should split previously merged record', async () => {

      const hostAId = RecordUtils.selectRecordId(familyA.record);
      const hostBId = RecordUtils.selectRecordId(familyB.record);
      
      familyMerged.record.appendField(RecordUtils.stringToField(`583    ‡aMERGED FROM (FI-MELINDA)${hostAId} + (FI-MELINDA)${hostBId}‡c2017-09-27T11:03:32+03:00‡5MELINDA`));
      
      const result = await splitRecord(clientStub, base, mergedHostId);

      expect(result.message).to.contain(`Record (${base})${mergedHostId} has been splitted into (${base})${hostAId} + (${base})${hostBId}`);
      
    });
  });
});

function createClientStub() {
  return {
    saveRecord: sinon.stub(),
    createRecord: sinon.stub(),
    loadRecord: sinon.stub(),
    loadSubrecords: sinon.stub()
  };
}

function expectFulfillmentToNotBeCalled(done) {
  return () => done(new Error('Fulfillment handler was called unexpectedly.'));
}

function expectErrorMessage(msg, done) {
  return function(err) {
    try {
      expect(err.message).to.equal(msg);
      done();
    } catch(e) {
      done(e);
    }
  };
}

function markAsDeleted(family) {
  const addDeletedMetadata = record => {
    record.appendField(['STA', '', '', 'a', 'DELETED']);
    RecordUtils.updateRecordLeader(record, 5, 'd');
  };

  addDeletedMetadata(family.record);

  family.subrecords.forEach(record => addDeletedMetadata(record));
}

function createRecordFamily(hostRecordId) {
  return {
    record: createRecord(hostRecordId),
    subrecords: []
  };
}

function createRecord(recordId) {
  const record = new MarcRecord();
  record.leader = '00000cam^a22002294i^4500';
  if (recordId) {
    record.appendControlField(['001', recordId]);
  }
  return record;
}

function createRandomRecordFamily() {
  return {
    record: createRandomRecord(),
    subrecords: [createRandomRecord(), createRandomRecord(), createRandomRecord()]
  }; 
}

function createRandomRecord() {
  const randomId = Math.floor(Math.random()*1000000);
  return createRecord(randomId);
}

function createRandomComponentRecord(parentId = Math.floor(Math.random()*1000000)) {
  const record = new MarcRecord();
  record.leader = '00000cam^a22002294i^4500';
  
  record.appendControlField(['001', Math.floor(Math.random()*1000000)]);
  setParentRecordId(parentId, record);
  
  return record;
}

function setParentRecordId(parentRecordId, componentRecord) {
  componentRecord.appendField(RecordUtils.stringToField(`773    ‡w(FI-MELINDA)${parentRecordId}`));
}

function createSuccessResponse(recordId) {
  return { 
    messages: [ { code: '0018', message: `Document: ${recordId} was updated successfully.` } ],
    errors: [],
    triggers: [ 
      { code: '0101', message: 'Field SID with text "$$c757724$$boula" is a duplicate entry in the INDEX file.' },
      { code: '0101', message: 'Field SID with text "$$c757724$$boula" is a duplicate entry in the INDEX file.' } 
    ],
    warnings: [ 
      { code: '0121', message: 'Document is duplicate in the database (Matched against System No. 003342333 by LOCATE command).' },
      { code: '0121', message: 'Document is duplicate in the database (Matched against System No. 000698067 by LOCATE command).' } 
    ],
    recordId: recordId
  };
}