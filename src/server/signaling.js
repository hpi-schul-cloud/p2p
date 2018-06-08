const socketIO = require('socket.io');

class SignalingServer {

  constructor() {
    this.clients = 0;
    // todo: debug infos
    // let clientsInRoom = io.sockets.adapter.rooms[room];
    // let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
  }

  static _onMessage(socket, msg) {
    socket.broadcast.emit('message', msg);
  }

  static _onCreate(socket, room) {
    // todo: check if room exists
    socket.join(room);
    socket.emit('created', room, socket.id);
  }

  static _onJoin(socket, room) {
    // todo: check if room has reached max members
    socket.join(room);
    socket.emit('joined', room, socket.id);
    socket.broadcast.emit('ready', room);
  }

  _dispatcher(socket) {
    socket.on('message', msg => SignalingServer._onMessage(socket, msg));
    socket.on('create', room => SignalingServer._onCreate(socket, room));
    socket.on('join', room => SignalingServer._onJoin(sockert, room));
  }

  start(app) {
    socketIO.listen(app).sockets.on('connection', this._dispatcher);
  }

}

module.exports = SignalingServer;