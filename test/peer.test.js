describe('Peer', function() {
  const CONFIG = {
    channel: 'FIXED_CLASS_1',
    stunServer: {
      'iceServers': [
        {
          'urls': 'stun:stun.l.google.com:19302',
        },
      ]
    }
  }
  var peer;

  var _event = {
    detail: 42
  }

  beforeEach(function() {;
    Peer.prototype._registerEvents = function () {};
    ServiceWorkerMiddleware.prototype._initListeners = function() {}
    Signaling.prototype._dispatcher = function() {};

    peer = new Peer(CONFIG);
    peer.peers = [ {id: 24}, {id: 5}, {id: 14}];
    peer.requests = [
      { from: 5, hash: 'test1' },
      { from: 5, hash: 'test2' },
      { from: 14, hash: 'test3' },
      { from: 14, hash: 'test1' }
    ]
  })

  it('dispatchs ui:onUpdate', function(done){
    ensureEvent('ui:onUpdate', done, peer, function(event){
      expect(event.detail.peerId).to.equal(peer.peerId);
      expect(event.detail.peers).to.equal(peer.peers);
    })
    peer._updateUI();
  })
  it('dispatchs sw:clientReady', function(done){
    ensureEvent('sw:clientReady', done, peer, function(event, a){})
    peer._updateSW();
  })

  describe('#_onReceiveId', function() {
    it('updates peerId', function(){
      peer._onReceiveId(_event);
      expect(peer.peerId).to.equal(_event.detail)
    })
    it('updates the UI', function(){
      peer._updateUI = sinon.spy();
      peer._onReceiveId(_event);
      expect(peer._updateUI).to.be.calledOnce;
    })
    it('updates the SW', function(){
      peer._updateSW = sinon.spy();
      peer._onReceiveId(_event);
      expect(peer._updateSW).to.be.calledOnce;
    })
  })

  describe('#_onUpdatePeers', function(){
    it('updates the Peers', function(){
      peer.updatePeers = sinon.spy();
      peer._onUpdatePeers(_event);
      expect(peer.updatePeers).to.be.calledOnce;
    })
    it('updates the UI', function(){
      peer.peers = [];
      peer._updateUI = sinon.spy();
      peer._onUpdatePeers(_event);
      expect(peer._updateUI).to.be.calledOnce;
    })
  })
  describe('#_onNewConnection', function(){
    it('calls connectTo', function(){
      peer.connectTo = sinon.spy();
      peer._onNewConnection(_event);
      expect(peer.connectTo).to.be.calledOnce;
    })
    it('updates the UI', function(){
      peer._updateUI = sinon.spy();
      peer._onNewConnection(_event);
      expect(peer._updateUI).to.be.calledOnce;
    })
  })
  describe('#_onRequestResource', function(){
    it('calls requestResourceFromPeers', function(){
      peer.requestResourceFromPeers = sinon.spy();
      peer._onRequestResource(_event);
      expect(peer.requestResourceFromPeers).to.be.calledOnce;
    })
  })
  describe('#_onSignalingMessage', function(){
    var _event = {
      detail: {
        peerId: 42,
        message: 'testmessage'
      }
    }
    it('calls receiveSignalMessage', function(){
      peer.receiveSignalMessage = sinon.spy();
      peer._onSignalingMessage(_event);
      expect(peer.receiveSignalMessage).to.be.calledOnce;
    })
    it('updates the UI', function(){
      peer._updateUI = sinon.spy();
      peer._onSignalingMessage(_event);
      expect(peer._updateUI).to.be.calledOnce;
    })
  })
  describe('#_onClosed', function(){
    it('calls removePeer', function(){
      peer.removePeer = sinon.spy();
      peer._onClosed(_event);
      expect(peer.removePeer).to.be.calledOnce;
    })
    it('updates the UI', function(){
      peer._updateUI = sinon.spy();
      peer._onClosed(_event);
      expect(peer._updateUI).to.be.calledOnce;
    })
  })
  describe('#_getPeerIdx', function(){
    it('returns the correct index', function() {
      expect(peer._getPeerIdx(peer.peers[1].id)).to.equal(1);
    })
  })

  describe('#_getPeer', function(){
    it('returns the correct peer', function(){
      expect(peer._getPeer(peer.peers[1].id).id).to.equal(peer.peers[1].id);
    })
    it('returns undefined', function(){
      expect(peer._getPeer(25)).to.equal(undefined);
    })
  })

  describe('#_getRequestId', function(){
    it('returns the correct id', function() {
      const id = peer._getRequestId(peer.requests[1].from, peer.requests[1].hash);
      expect(id).to.equal(1);
    })
  })

  describe('#_getRequest', function(){
    it('returns the correct request', function(){
      const orig_req = peer.requests[2]
      const req = peer._getRequest(orig_req.from, orig_req.hash)

      expect(req.from).to.equal(orig_req.from);
      expect(req.hash).to.equal(orig_req.hash);
    })
    it('returns undefined', function(){
      let req = peer._getRequest(-1, 'missing')
      expect(req).to.equal(undefined)
    })
  })

  describe('#_removeRequest', function(){
    it('removes the request', function() {
      let req = peer.requests[1];
      let prev_length = peer.requests.length;
      peer._removeRequest(req.from, req.hash);
      expect(peer.requests.length).to.equal(prev_length-1);
    })
  })

  describe('#_onLocalSessionCreated', function(){

  })

  describe('#_sendViaDataChannel', function(){
    let _peer;
    let msg;

    beforeEach(function() {
      _peer = peer.peers[2];
      msg = 'test message';
      peer.peers[2].requestQueue = []
    })
    describe('when data channel is connecting', function(){
      it('adds the request to the queue', function(){
        peer._sendViaDataChannel(_peer, msg)
        expect(_peer.requestQueue.length).to.equal(1)
        expect(_peer.requestQueue[0]).to.equal(msg)
      })
    })
    describe('when data channel is open', function(){
      describe('when request queue is empty', function(){
        it('sends the message', function(){
          peer.dataChannel = {
            readyState: 'open',
            send: function(message){
              expect(message).to.equal(msg);
              done();
            }
          }
          peer._sendViaDataChannel(_peer, msg)
        })
      })
    })
  })

  describe('#_sendToPeer', function(){
    it('calls _sendViaDataChannel', function() {
      peer._sendViaDataChannel = sinon.spy();
      peer.peerId = 4;
      peer._sendToPeer(peer.peers[1], 'testi', 'testi');
      expect(peer._sendViaDataChannel).to.be.calledOnce;
    })
  })

  describe('#_requestPeer', function(){
    let _peer;
    let hash;
    let cb;
    beforeEach(function() {
      _peer = peer.peers[1];
      msgType = 'test';
      hash = 'test hash';
      cb = function() {};
      peer.requests = [];
      peer._sendToPeer = sinon.spy();
    })
    it('adds the request', function(){
      peer._requestPeer(_peer, msgType, hash, cb);
      expect(peer.requests.length).to.equal(1)
    })
    it('sends forwards the request the the peer', function() {
      peer._requestPeer(_peer, msgType, hash, cb);
      expect(peer._sendToPeer).to.be.calledOnce;
    })
  })

  describe('#_addResource', function(){
    let _peer;
    beforeEach(function() {
      _peer = peer.peers[2]
      _peer.resources = [];
    })
    it('updates the UI', function(){
      peer._updateUI = sinon.spy();
      peer._addResource(_peer, {});
      expect(peer._updateUI).to.be.calledOnce;
    })
    it('adds the resource', function() {
      peer._addResource(_peer, { hash: 'testi' });
      expect(_peer.resources.length).to.equal(1);
    })
  })

  describe('#_checkCache', function(){
    it('dispatchs sw:onRequestCache', function(done){
      ensureEvent('sw:onRequestCache', done, peer, function(event, a){})
      peer._checkCache();
    })
  })

  describe('#_abToMessage', function(){
    it('pending')
  })

  describe('#_handleUpdate', function(){
    beforeEach(function() {
      peer._getPeer = function(_) { return peer.peers[1] };
      peer._addResource = sinon.spy();
    })
    it('adds the resource', function() {
      peer._handleUpdate('testi')
      expect(peer._addResource).to.be.calledOnce;
    })
  })

  describe('#_handleRequest', function(){
    const message = { hash: 'testi' }

    it('dispatchs sw:onRequestResource', function(done){
      ensureEvent('sw:onRequestResource', done, message, function(event, message){
        expect(event.detail.hash).to.equal( message.hash )
      })
      peer._handleRequest(message);
    })
  })

  describe('#_handleResponse', function(){
    const respondsAb = {
      byteLength: 20
    }
    const message = 'testi';
    describe('when message must not be chunked', function() {
      it('calls _sendToPeer', function() {
        peer._sendToPeer = sinon.spy();
        peer._handleResponse(message, respondsAb);
        expect(peer._sendToPeer).to.be.calledOnce;
      })
    })

    describe('when message must be chunked', function() {
      it('calls _sendChunkedToPeer', function() {
        peer.message.sizes.maxData = 1;
        peer._sendChunkedToPeer = sinon.spy();
        peer._handleResponse(message, respondsAb);
        expect(peer._sendChunkedToPeer).to.be.calledOnce;
      })
    })
  })

  describe('#_handleChunk', function(){
    it('pending');
  })

  describe('#_handleAnswer', function(){
    it('pending');
  })

  describe('#_sendChunkedToPeer', function(){
    it('pending');
  })

  describe('#_concatMessage', function(){
    it('pending');
  })

  describe('#_onDataChannelCreated', function(){
    it('pending');
  })

  describe('#connectTo', function(){
    it('pending');
  })

  describe('#receiveSignalMessage', function(){
    it('pending');
  })

  describe('#removePeer', function(){
    it('pending');
  })

  describe('#updatePeers', function(){
    it('pending');
  })

  describe('#requestResourceFromPeers', function(){
    it('pending');
  })
})
