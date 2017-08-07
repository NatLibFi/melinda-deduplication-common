const expect = require('chai').expect;

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
});
