class FayeConnection {
  constructor() {
    this.log = getLogger('openhpi:client-signaling');
    this.log('setup');
    this.client = new Faye.Client(window.location.origin + '/faye');
    // Logger = {
    //   incoming: function(message, callback) {
    //     console.log('incoming', message);
    //     callback(message);
    //   },
    //   outgoing: function(message, callback) {
    //     console.log('outgoing', message);
    //     callback(message);
    //   }
    // };
    //
    // this.client.addExtension(Logger);
  }

  on(channel, callback) {
    this.client.subscribe('/' + channel, callback);
  }

  send(channel, message) {
    this.client.publish('/'+channel, message);
  }
  sendTo(channel, to, message) {
    this.client.publish('/'+channel+'/'+to, message);
  }
}
