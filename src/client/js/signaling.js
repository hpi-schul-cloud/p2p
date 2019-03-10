class Signaling {

  constructor(config) {
    this.log = getLogger('openhpi:client-signaling');
    this.log('setup');
    this.channel = config.channel;
    this.peerId = config.clientId
    // this.socket = new SocketIOConnection();
    this.socket = new FayeConnection();
    this._dispatcher();
    this.join();
  }

  join() {
    this.socket.send('joined', { peerId: this.peerId});
  }

  _dispatcher() {
    this.socket.on('created', this._onCreated.bind(this));
    this.socket.on('joined', this._onJoined.bind(this));
    this.socket.on('closed', this._onClosed.bind(this));
    this.socket.on('ready', this._onReady.bind(this));
    this.socket.on('message/' + this.peerId, this._onMessage.bind(this));
  }

  _onCreated(message) {
    this.log('created channel %s, peerId %s', this.channel, message.peerId);

    document.dispatchEvent(
        new CustomEvent('peer:onReceiveId', {detail: message.peerId})
    );
  }

  _onJoined(message) {
    let peerId = message.peerId
    this.log('joined channel %s, peerId %s ', this.channel, peerId);

    document.dispatchEvent(
        new CustomEvent('peer:onReceiveId', {detail: peerId})
    );
    this.log('client %s has been joined.', peerId);
    document.dispatchEvent(
        new CustomEvent('peer:onNewConnection', {detail: peerId})
    );
  }

  _onReady(peerId) {
    // this.log('client %s has been joined.', peerId);
    // document.dispatchEvent(
    //     new CustomEvent('peer:onNewConnection', {detail: peerId})
    // );
  }

  _onMessage(message) {
    this.log('received message %o from %s', message.message, message.peerId);
    document.dispatchEvent(
        new CustomEvent('peer:onSignalingMessage',
            { detail: { message: message.message, peerId: message.peerId } })
    );
  }

  _onClosed(peerId) {
    this.log('peer %s closed connection', peerId);
    document.dispatchEvent(
        new CustomEvent('peer:onClose', { detail: peerId })
    );
  }

  hello(channel) {
    this.log('send hello for channel %s', channel);
    this.socket.send('hello', channel);
  }

  send(to, message) {
    this.log('send message %o to client %s', message, to);
    this.socket.sendTo('message', to, {peerId: this.peerId, message: message});
  }

}
