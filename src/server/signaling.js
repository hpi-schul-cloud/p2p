const socketIO = require('socket.io');
const debug = require('debug')('openhpi:signaling');

// let clientsInRoom = io.sockets.adapter.rooms[room];
// let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

class ServerSignaling {

  constructor() {
    debug('setup');
    this.channels = [];
    this.peers = [];
  }

  static _createPeer() {
    return {id: 0, channel: null, socket: null, resources: []};
  }

  static _createChannel(channel) {
    return {channel: channel, peers: []};
  }

  _addPeer(channel, peer) {
    const idx = this.channels.map(c => c.channel).indexOf(channel);
    const channelExists = idx >= 0;

    if (!channelExists) {
      const newChannel = ServerSignaling._createChannel(channel);
      newChannel.peers.push(peer);
      this.channels.push(newChannel);
      debug('new channel %s has a first peer: %o', channel, peer);
    } else {
      this.channels[idx].peers.push(peer);
      debug('channel %s has a new peer: %o', channel, peer);
    }
  }

  _joinPeer(socket, channel) {
    const peer = ServerSignaling._createPeer();

    peer.id = socket.id;
    peer.socket = socket;
    peer.channel = channel;

    this._addPeer(channel, peer);
    this.peers.push(peer);
  }

  _getPeers(requestPeerId, channel) {
    const idx = this.channels.map(c => c.channel).indexOf(channel);

    if (idx >= 0)
      return this.channels[idx].peers.filter(p => p.id !== requestPeerId);
    return [];
  }

  _getPeer(peerId) {
    const idx = this.peers.map(p => p.id).indexOf(peerId);

    if(idx >= 0)
      return this.peers[idx];
    return {}
  }

  _dispatcher(handler, socket) {
    socket.on('hello', channel => handler._onHello(socket, channel));
    socket.on('message', (to, msg) => handler._onMessage(socket, to, msg));
  }

  _onHello(socket, channel) {
    debug('received hello from client %s for channel: %s', socket.id, channel);

    // todo: how many channels can a peer create? Abuse possible ...

    const peerCount = this._getPeers(socket.id, channel).length;

    if (peerCount === 0) {
      this._createChannel(socket, channel);
    } else {
      this._joinChannel(socket, channel);
    }
  }

  _createChannel(socket, channel) {
    debug('creates channel %s client-id %s', channel, socket.id);

    // todo: check if room exists

    socket.join(channel);
    this._joinPeer(socket, channel);
    socket.emit('created', channel, socket.id);
  }

  _joinChannel(socket, channel) {
    debug('joins channel %s, client-id %s ', channel, socket.id);

    // todo: check if room has reached max members

    socket.join(channel);
    this._joinPeer(socket, channel);

    socket.broadcast.emit('joined', socket.id);
  }

  _onMessage(socket, to, msg) {
    debug('message %s to %s', msg, to);

    const from = socket.id;
    const peer = this._getPeer(to);

    peer.socket.emit('message', from, msg);
  }

  start(app) {
    socketIO.listen(app).sockets.on('connection', socket =>
        this._dispatcher(this, socket)
    );
  }


}

module.exports = ServerSignaling;