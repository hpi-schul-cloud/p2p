describe('Middleware', function() {
  var middleware;
  var msg = { hash: 'test', cb: 'cb' };

  beforeEach(function() {
    ServiceWorkerMiddleware.prototype._initListeners = function() {}
    middleware = new ServiceWorkerMiddleware({ serviceWorker: {} });
  })

  it('dispatchs peer:onRequestResource', function(done){
    ensureEvent('peer:onRequestResource', done, msg, function(event, msg){
      expect(event.detail.hash).to.equal(msg.hash);
      expect(event.detail.cb).to.equal(msg.cb);
    });

    middleware._onRequest('test', 'cb');
  })

  it('dispatchs peer:onUpdatePeers', function(done) {
    ensureEvent('peer:onUpdatePeers', done, msg, function(event){
      expect(event.detail).to.equal(msg.hash);
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
    var _event = {
      data: {
        type: 'addedResource',
        hash: 'test'
      }
    }
    it('notifies the peers on update', function(done) {
      middleware._onAddedResource = function (){
        done();
      }
      middleware._onServiceWorkerMessage(_event)
    })
    it('requests resource on request type', function(done) {
      _event.data.type = 'request';
      middleware._onRequest = function (){
        done();
      }
      middleware._onServiceWorkerMessage(_event)
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
})
