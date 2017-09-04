const chai = require('chai');
const expect = chai.expect;

const { parsePageInfo } = require('./record-utils');

describe('parsePageInfo', function() {

  it('should return PageInfo -object', function() {
    expect( parsePageInfo('138 s.')).to.be.an('object');
  });

  it('should return PageInfo -object with start and end properties', function() {
    const pageInfo = parsePageInfo('138 s.');
    expect( pageInfo ).to.have.keys(['start', 'end', 'str', 'total']);
  });

  it('should return PageInfo -object with correct start and end properties', function() {
    const pageInfo = parsePageInfo('138 s.');

    expect( pageInfo.start ).to.equal(0);
    expect( pageInfo.end ).to.equal(138);
    expect( pageInfo.total ).to.equal(138);
  });

  it('should return PageInfo -object with correct start and end properties for page ranges', function() {
    const pageInfo = parsePageInfo('S. 123-179.');

    expect( pageInfo.start ).to.equal(123);
    expect( pageInfo.end ).to.equal(179);
  });

  it('should return PageInfo -object with correct start and end properties for page ranges with [] -chars', function() {
    const pageInfo = parsePageInfo('Ss [348]-593');

    expect( pageInfo.start ).to.equal(348);
    expect( pageInfo.end ).to.equal(593);
  });

  it('handle roman numerals', function() {
    const pageInfo = parsePageInfo('XI, 373 s.');

    expect( pageInfo.start ).to.equal(0);
    expect( pageInfo.end ).to.equal(373);
    expect( pageInfo.total ).to.equal(384);

  });
  
  it('should prefer items that are not in parenthesis', function() {
    const pageInfo = parsePageInfo('(2) s., s. 519-590, (5) s. ');

    expect( pageInfo.start ).to.equal(519);
    expect( pageInfo.end ).to.equal(590);
    expect( pageInfo.total ).to.equal(71);
  });

  it('should prefer items that are not in parenthesis', function() {
    const pageInfo = parsePageInfo('(2) s., s. 431, (5) s. ');

    expect( pageInfo.start ).to.equal(0);
    expect( pageInfo.end ).to.equal(431);
    expect( pageInfo.total ).to.equal(431);
  });

  it('should prefer items that are not in parenthesis', function() {
    const pageInfo = parsePageInfo('vii s., s. 81-230, [2]  :');

    expect( pageInfo.start ).to.equal(81);
    expect( pageInfo.end ).to.equal(230);
    expect( pageInfo.total ).to.equal(149);
  });

  it('should use largest page count in the string', function() {
    const pageInfo = parsePageInfo('v, 443, 8 s.');
    expect( pageInfo.start ).to.equal(0);
    expect( pageInfo.end ).to.equal(443);
    expect( pageInfo.total ).to.equal(448);
  });

  it('should return null for data that contains something else than characters s, p or roman numerals or numbers', function() {
    const pageInfo = parsePageInfo('a1 kirja (63 s.), 1 CD-äänilevy ;');
    expect( pageInfo ).to.be.null;
  });
  
});
