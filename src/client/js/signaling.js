class Signaling {

  constructor() {
    this.log = debug('openhpi:signaling');
    this.log('setup');

    this.socket = io.connect();
    this.onReceivedPeerId = null;
    this.onNewPeerJoined = null;
    this.onClosed = null;
    this.onMessage = null;
    this.onRefresh = null;

    this._dispatcher();
  }

  _dispatcher() {
    this.socket.on('created', this._onCreated.bind(this));
    this.socket.on('joined', this._onJoined.bind(this));
    this.socket.on('closed', this._onClosed.bind(this));
    this.socket.on('ready', this._onReady.bind(this));
    this.socket.on('message', this._onMessage.bind(this));
  }

  _onCreated(channel, peerId) {
    this.log('created channel %s, peerId %s', channel, peerId);

    this.onReceivedPeerId(peerId);
  }

  _onJoined(channel, peerId) {
    this.log('joined channel %s, peerId %s ', channel, peerId);

    this.onReceivedPeerId(peerId);
  }

  _onClosed(peerId) {
    this.log('peer %s closed connection', peerId);

    this.onClosed(peerId);
  }


  _onReady(peerId) {
    this.log('client %s has been joined.', peerId);

    this.onNewPeerJoined(peerId);
  }

  _onMessage(from, message) {
    this.log('received message %o from %s', message, from);

    this.onMessage(from, message);
  }

  hello(channel) {
    this.log('send hello for channel %s', channel);

    this.socket.emit('hello', channel);
  }

  send(to, message) {
    this.log('send message %o to client %s', message, to);

    this.socket.emit('message', to, message);
  }

  close() {
    this.log('close connection');

    this.socket.emit('close');
  }

}
