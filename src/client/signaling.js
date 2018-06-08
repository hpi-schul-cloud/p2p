
class ClientSignaling {

  constructor() {
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
    console.log('Got a response ', peers);
    this.peers = JSON.parse(peers);

    if (this.peers.length > 0) {
      this._join();
    } else {
      this._create();
    }
  }

  _create() {
    this.socket.emit('create', this.channel);
  }

  _join() {
    this.socket.emit('join', this.channel);
  }

  _onCreated(room, clientId) {
    console.log('Created room', room, '- my client ID is', clientId);
  }

  _onJoined(room, clientId) {
    console.log('This peer has joined room', room, 'with client ID', clientId);
    // createPeerConnection(isInitiator, STUN_SERVER);
  }

  _onNewPeer() {
    console.log('Socket is ready');
    // createPeerConnection(isInitiator, STUN_SERVER);
  }

  _onMessage(message) {
    console.log('Client received message:', message);
    // signalingMessageCallback(message);
  }

  hello(channel) {
    this.channel = channel;
    this.socket.emit('hello', channel);
  }

  send(message) {
    console.log('Client sending message: ', message);
    this.socket.emit('message', message);
  }

}

const clientSignaling = new ClientSignaling();
// todo: this is fixed but should be student class room
const channel = 'room-1';

clientSignaling.hello(channel);