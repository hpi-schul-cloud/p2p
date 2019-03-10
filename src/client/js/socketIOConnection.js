class SocketIOConnection {
  constructor() {
    this.log = getLogger('openhpi:client-signaling');
    this.log('setup');
    this.socket = io.connect(window.location.origin, {forceNew: true});
  }

  on(event, callback) {
    this.socket.on(event, callback);
  }

  emit(type, channel, message) {
    this.socket.emit(type, channel, message);
  }
}
