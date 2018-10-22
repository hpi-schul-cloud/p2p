describe('Middleware', function() {
  var middleware;
  var msg = { hash: 'test', cb: 'cb' };

  beforeEach(function() {
    middleware = new ServiceWorkerMiddleware();
  })

  it('dispatchs peer:onRequestResource event', function(done){
    this.timeout(1000); //timeout with an error if done() isn't called within one second

    document.addEventListener('peer:onRequestResource', function(event){
      expect(event.detail.hash).to.equal(msg.hash);
      expect(event.detail.cb).to.equal(msg.cb);
      done();
    });

    middleware._onRequest('test', 'cb');
  })

  it('peer:onUpdatePeers', function(done) {
    this.timeout(1000);

    document.addEventListener('peer:onUpdatePeers', function(event){
      expect(event.detail).to.equal(msg.hash);
      done();
    });

    middleware._onUpdate(msg.hash);
  })
})
