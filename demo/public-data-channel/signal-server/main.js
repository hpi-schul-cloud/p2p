'use strict';

const os = require('os');
const fs = require('fs');
const nodeStatic = require('node-static');
const https = require('https');
const socketIO = require('socket.io');

const options = {
  key: fs.readFileSync('./cert/signal.key'),
  cert: fs.readFileSync('./cert/signal.crt')
};

const fileServer = new(nodeStatic.Server)();
const app = https.createServer(options, (req, res) => {
  fileServer.serve(req,res);
}).listen(8080);

const io = socketIO.listen(app);

io.sockets.on('connection', function(socket) {

  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('send_offer', function(message) {
    log('Client said: ', message);
    socket.broadcast.emit('received_offer', message);
  });

  socket.on('send_answer', function(message) {
    log('Client said: ', message);
    socket.broadcast.emit('received_answer', message);
  });

  socket.on('create or join', function(room) {

    socket.emit('frontend', 'Number of rooms: ' + Object.keys(io.sockets.adapter.rooms).length);
    socket.emit('frontend', 'Room: ' + room);

    log('Received request to create or join room ' + room);

    let clientsInRoom = io.sockets.adapter.rooms[room];
    let numClients = clientsInRoom ?
        Object.keys(clientsInRoom.sockets).length :
        0;

    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients === 1) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    const ifaces = os.networkInterfaces();

    console.log('ipaddr - DEBUG');

    for (let dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

});

module.exports = app;