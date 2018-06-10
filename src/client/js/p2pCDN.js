
localStorage.debug = '*,-socket.io*,-engine*';

const channel = 'FIXED_CLASS_1';

const STUN_SERVER = {
  'iceServers': [
    {
      'urls': 'stun:stun.l.google.com:19302',
    },
  ],
};


const clientSignaling = new ClientSignaling();
const webRTC = new WebRTC(clientSignaling.send.bind(clientSignaling), STUN_SERVER);
const clientServiceWorker = new ClientServiceWorker();

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
  clientSignaling.broadcastCachedResource(url);
};


clientSignaling.hello(channel);