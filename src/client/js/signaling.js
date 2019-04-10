class Signaling {

  constructor(config) {

    if(config.verbose) {
      this.log = getLogger('openhpi:client-signaling');
      this.log('setup');
    } else {
      this.log = function (message) { };
    }

    this.channel = config.channel;
    this.peerId = config.clientId
    this.socket = new FayeConnection();
    this._dispatcher();
    this.join();
  }

  join() {
    this.socket.send('joined', { peerId: this.peerId});
  }

  _dispatcher() {
    this.socket.on('joined', this._onJoined.bind(this));
    this.socket.on('message/' + this.peerId, this._onMessage.bind(this));
  }

  _onJoined(message) {
    let peerId = message.peerId

    this.log('client %s has been joined.', peerId);
    document.dispatchEvent(
        new CustomEvent('peer:onNewConnection', {detail: peerId})
    );
  }

  _onMessage(message) {
    this.log('received message %o from %s', message.message, message.peerId);
    document.dispatchEvent(
        new CustomEvent('peer:onSignalingMessage',
            { detail: { message: message.message, peerId: message.peerId } })
      );
  }

  send(to, message) {
    this.log('send message %o to client %s', message, to);
    this.socket.sendTo('message', to, {peerId: this.peerId, message: message});
  }

}
