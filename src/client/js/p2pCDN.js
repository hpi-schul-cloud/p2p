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
    try{
      this.signaling = new Signaling();
      this.peer = new Peer(this.signaling.send.bind(this.signaling), STUN_SERVER);
      this.serviceWorker = new ServiceWorkerMiddleware();

      // frontend events
      this.onPeerId = null;
      this.onUpdate = null;

      this._dispatching();

      // Send handshake to server
      this.signaling.hello(channel);
    } catch(e){
      this.peer.onReady();
    }
  }

  _dispatching(){
    this.signaling.onReceivedPeerId = peerId => {
      this.peer.peerId = peerId;
      this.onPeerId(peerId);
    };

    this.signaling.onNewPeerJoined = peerId => {
      this.peer.connectTo(peerId);
      this.onUpdate(this.peer.peers);
    };

    this.signaling.onClosed = peerId => {
      this.peer.removePeer(peerId);
      this.onUpdate(this.peer.peers);
    };

    this.signaling.onMessage = (from, message) => {
      this.peer.receiveSignalMessage(from, message);
      this.onUpdate(this.peer.peers);
    };

    this.serviceWorker.onRequest = (hash, cb) => {
      this.peer.requestResourceFromPeers(hash, cb);
      this.onUpdate(this.peer.peers);
    };

    this.serviceWorker.onUpdate = hash => {
      this.peer.updatePeers(hash);
      this.onUpdate(this.peer.peers);
    };

    this.peer.onUpdatePeers = peers => {
      this.onUpdate(peers);
    };

    this.peer.onReady = () => {
      const msg = { type: 'status', msg: 'ready' };
      this.serviceWorker.messageToServiceWorker(msg)
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
