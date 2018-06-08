const socketIO = require('socket.io');

class ServerSignaling {

  constructor() {
    this.channels = [];
    // todo: debug infos
    // let clientsInRoom = io.sockets.adapter.rooms[room];
    // let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
  }

  static _createPeer() {
    return {clientId: 0, channel: null, resources: []};
  }

  static _createChannel(channel) {
    return {channel: channel, peers: []};
  }

  _addPeer(channel, peer) {
    const idx = this.channels.indexOf(channel);
    const channelExists = idx >= 0;

    if (!channelExists) {
      const newChannel = ServerSignaling._createChannel(channel);
      newChannel.peers.push(peer);
      this.channels.push(newChannel);
    } else {
      this.channels[idx].channel.push(peer);
    }
  }

  _joinPeer(socket, channel) {
    const peer = ServerSignaling._createPeer();

    peer.clientId = socket.id;
    peer.channel = channel;

    this._addPeer(channel, peer);
  }

  _getPeers(channel) {
    const idx = this.channels.map(c => c.channel).indexOf(channel);
    if (idx >= 0)
      return this.channels[idx];
    return [];
  }

  _onHello(socket, channel) {
    const peers = this._getPeers(channel);
    socket.emit('reply', JSON.stringify(peers));
  }

  _onCreate(socket, channel) {
    // todo: check if room exists
    socket.join(channel);
    this._joinPeer(socket, channel);
    socket.emit('created', channel, socket.id);
  }

  static _onJoin(socket, channel) {
    // todo: check if room has reached max members
    socket.join(channel);
    this._joinPeer(socket, channel);
    socket.emit('joined', channel, socket.id);
    socket.broadcast.emit('ready', channel);
  }

  static _onMessage(socket, msg) {
    socket.broadcast.emit('message', msg);
  }

  _dispatcher(handler, socket) {
    socket.on('hello', channel => handler._onHello(socket, channel));
    socket.on('create', channel => handler._onCreate(socket, channel));
    socket.on('join', channel => handler._onJoin(sockert, channel));
    socket.on('message', msg => handler._onMessage(socket, msg));
  }

  start(app) {
    socketIO.listen(app).sockets.on('connection', socket =>
        this._dispatcher(this, socket)
    );
  }

}

module.exports = ServerSignaling;