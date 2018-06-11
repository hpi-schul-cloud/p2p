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
const clientSignaling = new ClientSignaling();
const webRTC = new WebRTC(clientSignaling.send.bind(clientSignaling), STUN_SERVER);
const clientServiceWorker = new ClientServiceWorker();

// Setting up middleware
clientSignaling.onReceivedPeerId = peerId => {
  webRTC.peerId = peerId;
};

clientSignaling.onNewPeerJoined = peerId => {
  webRTC.createPeerConnection(peerId);
};

clientSignaling.onMessage = (from, message) => {
  webRTC.messageCallback(from, message);
};

clientServiceWorker.onRequest = (url, cb) => {
  webRTC.requestResource(url, cb);
};

clientServiceWorker.onCached = (url) => {
  webRTC.broadcastPeers(url);
};

// Send handshake to server
clientSignaling.hello(channel);