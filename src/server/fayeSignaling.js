// const socketIO = require('socket.io');
var http = require('http');
var faye = require('faye');
const debug = require('debug')('openhpi:server-signaling');
class FayeServerSignaling {

  constructor(server) {
    var bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});
    bayeux.attach(server);
  }
}

module.exports = FayeServerSignaling;
