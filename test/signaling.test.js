describe('Signaling', function() {
  var signaling;
  const channel = 'test';
  const peerId = 1;
  const message = 'test message';
  beforeEach(function() {
    Signaling.prototype._dispatcher = function() {};
    signaling = new Signaling();
  });

  it('dispatchs peer:onReceiveId', function(done) {
    ensureEvent('peer:onReceiveId', done, peerId, function(event, peerId){
      expect(event.detail).to.equal(peerId);
    });
    signaling._onCreated(channel, peerId);
  });


  it('dispatchs peer:onNewConnection', function(done) {
    ensureEvent('peer:onNewConnection', done, peerId, function(event, peerId) {
      expect(event.detail).to.equal(peerId);
    });
    signaling._onReady(peerId);
  });

  it('dispatchs peer:onSignalingMessage', function(done) {
    ensureEvent(
      'peer:onSignalingMessage',
      done,
      { peerId: peerId, message: message},
      function(event, data) {
        expect(event.detail.peerId).to.equal(data.peerId);
        expect(event.detail.message).to.equal(data.message);
      }
    );
    signaling._onMessage(peerId, message);
  });

  it('dispatchs peer:onClose', function(done) {
    ensureEvent('peer:onClose', done, peerId, function(event, peerId) {
      expect(event.detail).to.equal(peerId);
    });
    signaling._onClosed(peerId);
  });

  function mockSocket(expectedType, expectedChannel, done, expectedMessage) {
    signaling.socket.emit = function(_type, _channel, _message) {
      expect(_type).to.equal(expectedType);
      expect(_channel).to.equal(expectedChannel);
      expect(_message).to.equal(expectedMessage);

      done();
    }
  }
  it('emits hello', function(done) {
    mockSocket('hello', channel, done);
    signaling.hello(channel);
  });
  it('emits the message', function(done) {
    mockSocket('message', channel, done, message);
    signaling.send(channel, message);
  });
})
