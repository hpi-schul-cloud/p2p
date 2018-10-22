describe('Middleware', function() {
  var middleware;
  var msg = { hash: 'test', cb: 'cb' };

  beforeEach(function() {
    middleware = new ServiceWorkerMiddleware();
  })

  it('dispatchs peer:onRequestResource', function(done){
    this.timeout(1000); //timeout with an error if done() isn't called within one second

    document.addEventListener('peer:onRequestResource', function(event){
      expect(event.detail.hash).to.equal(msg.hash);
      expect(event.detail.cb).to.equal(msg.cb);
      done();
    });

    middleware._onRequest('test', 'cb');
  })

  it('dispatchs peer:onUpdatePeers', function(done) {
    this.timeout(1000);

    document.addEventListener('peer:onUpdatePeers', function(event){
      expect(event.detail).to.equal(msg.hash);
      done();
    });

    middleware._onUpdate(msg.hash);
  })

  it('calls sendMessageToServiceWorker', function(done){
    middleware.messageToServiceWorker = function(msg) {
      const expected = { type: 'status', msg: 'ready' };
      expect(msg.type).to.equal(expected.type)
      expect(msg.msg).to.equal(expected.msg)
      done();
    }
    middleware._onClientReady();
  })

  describe('#_onServiceWorkerMessage', function() {
    var event = {
      data: {
        type: 'update',
        hash: 'test'
      }
    }
    it('notifies the peers on update', function(done) {
      middleware._onUpdate = function (){
        done();
      }
      middleware._onServiceWorkerMessage(event)
    })
    it('requests resource on request type', function(done) {
      event.data.type = 'request';
      middleware._onRequest = function (){
        done();
      }
      middleware._onServiceWorkerMessage(event)
    })
  })
  it('requests the cached resouces', function(done) {
    middleware.messageToServiceWorker = function (msg){
      expect(msg.type).to.equal('cache');
      done();
    }
    middleware._onRequestCache({})
  })
  it('requests the resouces', function(done) {
    var event = {
      detail: {
        hash: 'test'
      }
    }
    middleware.messageToServiceWorker = function (msg){
      const expected = { type: "resource", resource: event.detail.hash };

      expect(expected.type).to.equal(msg.type);
      expect(expected.resource).to.equal(msg.resource);
      done();
    }
    middleware._onRequestResource(event)
  })

  it('resolves to undefined', async function() {
    let x = await middleware.messageToServiceWorker({});
    expect(x).to.equal(undefined)
  })
  it('resolves not to undefined', async function() {
    let x = await middleware.messageToServiceWorker({});
    expect(x).to.equal(undefined)
  })
})
