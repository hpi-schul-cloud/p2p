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
    this.serviceWorker = new ServiceWorkerMiddleware(this.peer);

    this._dispatching();

    // Send handshake to server
    this.signaling.hello(channel);
  }

  _dispatching(){
    this.sendOnUpdate = () => {
      document.dispatchEvent(
        new CustomEvent('p2pCDN:onUpdate', {detail: p2pCnd.peer.peers})
      );
    };

    this.serviceWorker.onUpdate = hash => {
      this.peer.updatePeers(hash);
      this.sendOnUpdate();
    };

    this.peer.onUpdatePeers = this.sendOnUpdate;

    this.peer.onReady = () => {
      const msg = { type: 'status', msg: 'ready' };
      this.serviceWorker.messageToServiceWorker(msg)
    };

    this.peer.onCheckCache = respond => {
      const msg = { type: "cache" };

      this.serviceWorker.messageToServiceWorker(msg).then(cachedResouces => {
        respond(cachedResouces);
      });
    };

    this.peer.onRequested = (hash, respond) => {
      const msg = { type: "resource", resource: hash };

      this.serviceWorker.messageToServiceWorker(msg).then(response => {
        respond(response);
      });
    };

    window.onbeforeunload = () => {
      this.signaling.close();
    };
  }
}

const p2pCnd = new P2pCdn();
