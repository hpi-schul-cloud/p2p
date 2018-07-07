// Init
localStorage.debug = '*,-socket.io*,-engine*';
const channel = 'FIXED_CLASS_1';
const STUN_SERVER = {
  'iceServers': [
    {
      'urls': 'stun:stun.l.google.com:19302',
    },
  ],
};

class P2pCdn {

  constructor (){
    this.signaling = new Signaling();
    this.peer = new Peer(this.signaling.send.bind(this.signaling), STUN_SERVER);
    this.serviceWorker = new ServiceWorkerMiddleware();

    this._dispatching();

    // Send handshake to server
    this.signaling.hello(channel);
  }

  _dispatching(){
    this.signaling.onReceivedPeerId = peerId => {
      this.peer.peerId = peerId;
    };

    this.signaling.onNewPeerJoined = peerId => {
      this.peer.connectTo(peerId);
    };

    this.signaling.onClosed = peerId => {
      this.peer.removePeer(peerId);
    };

    this.signaling.onMessage = (from, message) => {
      this.peer.receiveSignalMessage(from, message);
    };

    this.serviceWorker.onRequest = (hash, cb) => {
      this.peer.requestResourceFromPeers(hash, cb);
    };

    this.serviceWorker.onUpdate = hash => {
      this.peer.updatePeers(hash);
    };

    this.peer.onRequested = (hash, respond) => {
      this.serviceWorker.messageToServiceWorker(hash).then(response => {
        respond(response);
      });
    };

    window.onbeforeunload = () => {
      this.signaling.close();
    };
  }
}

const p2pCnd = new P2pCdn();