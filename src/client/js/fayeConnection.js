class FayeConnection {
  constructor() {
    this.client = new Faye.Client(window.location.origin + '/faye');
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
