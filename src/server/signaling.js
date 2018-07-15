const socketIO = require('socket.io');
const debug = require('debug')('openhpi:server-signaling');

class ServerSignaling {

  constructor() {
    debug('setup');
    this.io = null;
    this.peers = [];
  }

  _getClientId(socket) {
    const max = 24;
    let result = socket.id;

    if (result.length > max)
      this.log('error! socket id %s longer than %d', socket.id, max);

    while(result.length < max) {
      result += '0'
    }

    return result;
  }

  _joinPeer(socket) {
    const peer = {id: 0, socket: null};

    peer.id = this._getClientId(socket);
    peer.socket = socket;

    this.peers.push(peer);
  }

  _getPeer(peerId) {
    const idx = this.peers.map(p => p.id).indexOf(peerId);

    if(idx >= 0)
      return this.peers[idx];
    return {}
  }

  _createChannel(socket, channel) {
    debug('creates channel %s client-id %s', channel, socket.id);
    const peerId = this._getClientId(socket);

    socket.join(channel);
    this._joinPeer(socket, channel);
    socket.emit('created', channel, peerId);
  }

  _joinChannel(socket, channel) {
    debug('joins channel %s, client-id %s ', channel, socket.id);
    const peerId = this._getClientId(socket);

    // todo: check if room has reached max members?
    socket.join(channel);
    this._joinPeer(socket, channel);

    socket.emit('joined', channel, peerId);
    socket.broadcast.emit('ready', peerId);
  }

  _dispatcher(handler, socket) {
    socket.on('hello', channel => handler._onHello(socket, channel));
    socket.on('disconnect', () => handler._onDisconnect(socket));
    socket.on('message', (to, msg) => handler._onMessage(socket, to, msg));
  }

  _onHello(socket, channel) {
    debug('received hello from client %s for channel: %s', socket.id, channel);
    const rooms = this.io.adapter.rooms[channel];
    const clients = rooms ? Object.keys(rooms.sockets).length : 0;

    if (clients === 0) {
      this._createChannel(socket, channel);
    } else {
      this._joinChannel(socket, channel);
    }
  }

  _onDisconnect(socket) {
    debug('connection disconnect for %s', socket.id);
    const peerId = this._getClientId(socket);
    const idx = this.peers.map(p => p.id).indexOf(peerId);

    if(idx >= 0)
      this.peers.splice(idx, 1);
    socket.broadcast.emit('closed', peerId);
  }

  _onMessage(socket, to, msg) {
    debug('message %o to %s', msg, to);
    const from = this._getClientId(socket);
    const peer = this._getPeer(to);

    if(peer.socket)
      peer.socket.emit('message', from, msg);
  }

  start(app) {
    this.io = socketIO.listen(app).sockets.on('connection', socket =>
        this._dispatcher(this, socket)
    );
  }
}

module.exports = ServerSignaling;
