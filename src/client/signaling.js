const STUN_SERVER = {
  'iceServers': [
    {
      'urls': 'stun:stun.l.google.com:19302',
    },
  ],
};

class ClientSignaling {

  constructor() {
    this.log = debug('openhpi:signaling');
    this.log('setup');

    this.socket = io.connect();
    this.webRTC = new WebRTC(this.send.bind(this), STUN_SERVER);

    this._dispatcher();
  }

  _dispatcher() {
    this.socket.on('created', this._onCreated.bind(this));
    this.socket.on('joined', this._onJoined.bind(this));
    this.socket.on('message', this._onMessage.bind(this));
  }

  _onCreated(channel, peerId) {
    this.log('created channel %s, peerId %s', channel, peerId);
  }

  _onJoined(peerId) {
    this.log('client %s has been joined.', peerId);

    this.webRTC.createPeerConnection(peerId, true);
  }

  _onMessage(from, message) {
    this.log('received message %s from %s', message, from);

    this.webRTC.messageCallback(from, message);
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

const clientSignaling = new ClientSignaling();
// todo: this is fixed but should be student class room
const channel = 'FIXED_CLASS_1';
// todo: this should be moved as well
localStorage.debug = '*,-socket.io*,-engine*';

clientSignaling.hello(channel);