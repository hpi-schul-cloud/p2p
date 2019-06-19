class Signaling {

  constructor(config) {

    if(config.verbose) {
      this.log = getLogger('p2pCDN:client-signaling');
      this.logDetail = getLogger('p2pCDN:client-signaling:detail');
    } else {
      this.log = function (message) { };
      this.logDetail = function (_) {}
    }

    this.mesh = config.channel;
    this.peerId = config.clientId
    this.socket = new FayeConnection();
    this._dispatcher();
    this.join();
  }

  join() {
    this.socket.send(this._getChannel('joined'), { peerId: this.peerId});
  }

  _getChannel(channel) {
    return this.mesh + '/' + channel
  }

  _dispatcher() {
    this.socket.on(this._getChannel('joined'), this._onJoined.bind(this));
    this.socket.on(this._getChannel('message/' + this.peerId), this._onMessage.bind(this));
  }

  _onJoined(message) {
    let peerId = message.peerId

    this.log('client %s has joined.', peerId);
    document.dispatchEvent(
        new CustomEvent('peer:onNewConnection', {detail: peerId})
    );
  }

  _onMessage(message) {
    this.logDetail('received message %o from %s', message.message, message.peerId);
    document.dispatchEvent(
        new CustomEvent('peer:onSignalingMessage',
            { detail: { message: message.message, peerId: message.peerId } })
      );
  }

  send(to, message) {
    this.logDetail('send message %o to client %s', message, to);
    this.socket.sendTo(this._getChannel('message'), to, {peerId: this.peerId, message: message});
  }

}
