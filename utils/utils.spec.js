const expect = require('chai').expect;
const sinon = require('sinon');

const utils = require('./utils');

describe('utils', () => {

  describe('hrtimeToMs', () => {

    it('should convert seconds to milliseconds', () => {
      expect(utils.hrtimeToMs([13, 0])).to.equal(13000);
    });

    it('should drop precision after milliseconds', () => {
      expect(utils.hrtimeToMs([13, 1000])).to.equal(13000);
    });

    it('should convert seconds and nanoseconds to milliseconds', () => {
      expect(utils.hrtimeToMs([13, 1000000])).to.equal(13001);
    });

  });

  describe('waitAndRetry', () => {

    it('should retry thrice', async () => {
      const fakeFn = sinon.stub();
      fakeFn.onCall(0).rejects(new Error('Rejecting first call'));
      fakeFn.onCall(1).rejects(new Error('Rejecting second call'));
      fakeFn.onCall(2).rejects(new Error('Rejecting third call'));
      
      const onRetrySpy = sinon.spy();

      try {
        await utils.waitAndRetry(fakeFn, onRetrySpy, 10);
      } catch(error) {
        expect(error.message).to.equal('Rejecting third call');
        expect(fakeFn.callCount).to.equal(3);
        expect(onRetrySpy.callCount).to.equal(2);
      }
      
    });

    it('should return result if call succeeds', async () => {
      const fakeFn = sinon.stub();
      fakeFn.onCall(0).rejects(new Error('Rejecting first call'));
      fakeFn.onCall(1).rejects(new Error('Rejecting second call'));
      fakeFn.onCall(2).resolves('result');
      
      const onRetrySpy = sinon.spy();

      const result = await utils.waitAndRetry(fakeFn, onRetrySpy, 10);
      expect(result).to.equal('result');
      expect(fakeFn.callCount).to.equal(3);
      expect(onRetrySpy.callCount).to.equal(2);
      
    });

  });
});
