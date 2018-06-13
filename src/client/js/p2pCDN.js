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

// Definition
const signaling = new Signaling();
const peer = new Peer(signaling.send.bind(signaling), STUN_SERVER);
const serviceWorkerMiddleware = new ServiceWorkerMiddleware();

// Setting up middleware
signaling.onReceivedPeerId = peerId => {
  peer.peerId = peerId;
};

signaling.onNewPeerJoined = peerId => {
  peer.connectTo(peerId);
};

signaling.onClosed = peerId => {
  peer.removePeer(peerId);
};

signaling.onMessage = (from, message) => {
  peer.messageCallback(from, message);
};

serviceWorkerMiddleware.onRequest = (url, cb) => {
  peer.requestPeers(url, cb);
};

serviceWorkerMiddleware.onUpdate = hash => {
  peer.updatePeers(hash);
};

peer.onRequested = (hash, respond) => {
  serviceWorkerMiddleware.messageToServiceWorker(hash).then(response => {
    respond(response);
  });
};

window.onbeforeunload = () => {
  signaling.close();
};

// Send handshake to server
signaling.hello(channel);