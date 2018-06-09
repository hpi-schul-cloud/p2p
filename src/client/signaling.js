const log = debug('openhpi:signaling');

class ClientSignaling {

  constructor() {
    log('setup');

    this.socket = io.connect();
    this.peers = null;
    this.channel = null;
    this._dispatcher();
  }

  _dispatcher() {
    this.socket.on('reply', this._onReply.bind(this));
    this.socket.on('created', this._onCreated.bind(this));
    this.socket.on('joined', this._onJoined.bind(this));
    this.socket.on('newPeer', this._onNewPeer.bind(this));
    this.socket.on('message', this._onMessage.bind(this));
  }

  _onReply(peers) {
    log('received reply %o', peers);

    this.peers = JSON.parse(peers);

    if (this.peers.length > 0) {
      this._join();
    } else {
      this._create();
    }
  }

  _create() {
    log('create channel %s', this.channel);

    this.socket.emit('create', this.channel);
  }

  _join() {
    log('join channel %s', this.channel);

    this.socket.emit('join', this.channel);
  }

  _onCreated(channel, clientId) {
    log('channel %s created - my ID is %s', channel, clientId);
  }

  _onJoined(channel, clientId) {
    log('joined channel %s with the ID %s', channel, clientId);

    // createPeerConnection(isInitiator, STUN_SERVER);
  }

  _onNewPeer() {
    log('new peer has been joined');

    // createPeerConnection(isInitiator, STUN_SERVER);
  }

  _onMessage(message) {
    log('received message %s', message);

    // signalingMessageCallback(message);
  }

  hello(channel) {
    log('send hello for channel %s', channel);

    this.channel = channel;
    this.socket.emit('hello', channel);
  }

  send(message) {
    log('send message %s', message);

    this.socket.emit('message', message);
  }

}

const clientSignaling = new ClientSignaling();
// todo: this is fixed but should be student class room
const channel = 'FIXED_CLASS_1';
// todo: this should be moved as well
localStorage.debug = '*,-socket.io*,-engine*';

clientSignaling.hello(channel);