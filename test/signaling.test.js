describe('Signaling', function() {
  var signaling;
  const channel = 'test';
  const peerId = 1;
  const message = 'test message';
  beforeEach(function() {;
    signaling = new Signaling();
  })
  it('dispatchs peer:onReceiveId', function(done) {
    this.timeout(1000);
    document.addEventListener('peer:onReceiveId', function(event){
      expect(event.detail).to.equal(peerId);
      done();
    });
    signaling._onCreated(channel, peerId);
  })

  it('dispatchs peer:onReceiveId', function(done) {
    this.timeout(1000);
    document.addEventListener('peer:onReceiveId', function(event){
      expect(event.detail).to.equal(peerId);
      done();
    });
    signaling._onJoined(channel, peerId);
  })

  it('dispatchs peer:onNewConnection', function(done) {
    this.timeout(1000);
    document.addEventListener('peer:onNewConnection', function(event){
      expect(event.detail).to.equal(peerId);
      done();
    });
    signaling._onReady(peerId);
  })

  it('dispatchs peer:onSignalingMessage', function(done) {
    this.timeout(1000);
    document.addEventListener('peer:onSignalingMessage', function(event){
      expect(event.detail.peerId).to.equal(peerId);
      expect(event.detail.message).to.equal(message);
      done();
    });
    signaling._onMessage(peerId, message);
  })

  it('dispatchs peer:onClose', function(done) {
    this.timeout(1000);
    document.addEventListener('peer:onClose', function(event){
      expect(event.detail).to.equal(peerId);
      done();
    });
    signaling._onClosed(peerId);
  })

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
  })
  it('emits the message', function(done) {
    mockSocket('message', channel, done, message);
    signaling.send(channel, message);
  })
})
