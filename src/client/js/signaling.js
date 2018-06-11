class ClientSignaling {

  constructor() {
    this.log = debug('openhpi:signaling');
    this.log('setup');

    this.socket = io.connect();
    this.onReceivedPeerId = null;
    this.onNewPeerJoined = null;
    this.onMessage = null;
    this.onRefresh = null;

    this._dispatcher();
  }

  _dispatcher() {
    this.socket.on('created', this._onCreated.bind(this));
    this.socket.on('joined', this._onJoined.bind(this));
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

  _onReady(peerId) {
    this.log('client %s has been joined.', peerId);

    this.onNewPeerJoined(peerId);
  }

  _onMessage(from, message) {
    this.log('received message %s from %s', message, from);

    this.onMessage(from, message);
  }

  hello(channel) {
    this.log('send hello for channel %s', channel);

    this.socket.emit('hello', channel);
  }

  send(to, message) {
    this.log('send message %s to client %s', message, to);

    this.socket.emit('message', to, message);
  }

}
