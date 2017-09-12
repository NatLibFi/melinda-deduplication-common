
const chai = require('chai');
const expect = chai.expect;
const { moreRecent } = require('./normalizers');

describe('normalizers', () => {

  describe('moreRecent', function() {
    
    describe('when both records are quite recent', () => {

      it('should return 0 if records are equally recent', function() {

        const recent = moreRecent(2, 0);

        expect(recent('170606', '170606')).to.equal(0);
      });
      
      it('should return 1 if first record is more recent', function() {
        
        const recent = moreRecent(2, 0);

        expect(recent('170706', '170606')).to.equal(1);
      });


      it('should return 0 if second record is more recent', function() {
        
        const recent = moreRecent(2, 0);

        expect(recent('170506', '170606')).to.equal(0);
      });

    });

    it('should return 0 if records are close to each other', () => {
      const recent = moreRecent(2, 1);
      
      expect(recent('170606', '161206')).to.equal(0);
    });
      
    it('should handle YYMMDD format', () => {
      const recent = moreRecent(2, 1);
      
      expect(recent('170606', '991206')).to.equal(1);
    });
      
    

  });

});