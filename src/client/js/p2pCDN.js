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
  webRTC.requestPeer(url, cb);
};

clientServiceWorker.onUpdate = hash => {
  webRTC.updatePeers(hash);
};

webRTC.onRequested = (hash, respond) => {
  clientServiceWorker.messageToServiceWorker(hash).then(response => {
    respond(response);
  });
};

// Send handshake to server
clientSignaling.hello(channel);