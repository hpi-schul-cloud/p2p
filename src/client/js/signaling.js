class Signaling {

  constructor() {
    this.log = debug('openhpi:client-signaling');
    this.log('setup');
    this.socket = io.connect(window.location.href, {forceNew: true});
    this._dispatcher();
  }

  _dispatcher() {
    this.socket.on('created', this._onCreated.bind(this));
    this.socket.on('joined', this._onJoined.bind(this));
    this.socket.on('closed', this._onClosed.bind(this));
    this.socket.on('ready', this._onReady.bind(this));
    this.socket.on('message', this._onMessage.bind(this));
  }

  _onCreated(channel, peerId) {
    this.log('created channel %s, peerId %s', channel, peerId);

    document.dispatchEvent(
        new CustomEvent('peer:onReceiveId', {detail: peerId})
    );
  }

  _onJoined(channel, peerId) {
    this.log('joined channel %s, peerId %s ', channel, peerId);

    document.dispatchEvent(
        new CustomEvent('peer:onReceiveId', {detail: peerId})
    );
  }

  _onReady(peerId) {
    this.log('client %s has been joined.', peerId);
    document.dispatchEvent(
        new CustomEvent('peer:onNewConnection', {detail: peerId})
    );
  }

  _onMessage(from, message) {
    this.log('received message %o from %s', message, from);
    document.dispatchEvent(
        new CustomEvent('peer:onSignalingMessage',
            { detail: { message: message, peerId: from } })
    );
  }

  _onClosed(peerId) {
    this.log('peer %s closed connection', peerId);
    document.dispatchEvent(
        new CustomEvent('peer:onClose', { detail: peerId })
    );
  }

  hello(channel) {
    this.log('send hello for channel %s', channel);
    this.socket.emit('hello', channel);
  }

  send(to, message) {
    this.log('send message %o to client %s', message, to);
    this.socket.emit('message', to, message);
  }

}
