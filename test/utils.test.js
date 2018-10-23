describe('Peer', function() {

  describe('#toHex', function(){
    it('returns the correct hexCodes', function(){
      const buffer = strToAb('test');
      const hex = toHex(buffer);
      const expected = '74657374';
      expect(hex).to.equal(expected);
    })
  })

  describe('#sha256', function(){
    it('returns the correct sha', function(done){
      const sha = sha256('http://www.example.com/test?foo=bar&bar=foo');
      const expected = '91590b969dd408010e48955d0afdad8717cc5d102c5f2891e726d0b87d61f431'
      sha.then(function(result){
        expect(result).to.equal(expected);
        done();
      })
    })
  })

  describe('#abToStr', function(){
    it('returns the correct string', function(){
      const expectedStr = "test";
      const buffer = strToAb(expectedStr);
      const str = abToStr(buffer);
      expect(str).to.equal(expectedStr);
    })
  })

  describe('#concatAbs', function(){
    it('returns the correct hexCodes', function(){
      const arrayBufferA = strToAb('testA');
      const arrayBufferB = strToAb('testB');
      const concatedAb = concatAbs([arrayBufferA, arrayBufferB])
      expect(concatedAb.byteLength).to.equal(arrayBufferA.byteLength + arrayBufferB.byteLength)
    })
  })

})
