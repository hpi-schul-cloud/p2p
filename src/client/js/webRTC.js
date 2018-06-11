class WebRTC {

  constructor(signalFunction, stunServer) {
    this.log = debug('openhpi:webRTC');
    this.log('setup');

    this.signal = signalFunction;
    this.stunServer = stunServer;
    this.peerId = null;
    this.peers = [];
    this.messageTypes = Object.freeze({"refresh": 1});
  }

  _peerExists(peerId) {
    return this.peers.map(p => p.id).indexOf(peerId) >= 0;
  }

  _getPeer(peerId) {
    let idx = -1;

    for (let i = 0; i < this.peers.length; i++) {
      if(this.peers[i].id === peerId) {
        idx = i;
        break;
      }
    }

    if (idx >= 0)
      return this.peers[idx];
    return undefined;
  }

  _onLocalSessionCreated(peerId, desc) {
    this.log('local session created: %o', desc);

    const peer = this._getPeer(peerId);

    peer.con.setLocalDescription(desc).then(() => {
      this.log('sending local desc: %o', peer.con.localDescription);
      this.signal(peer.id, peer.con.localDescription);
    });
  }

  _onDataChannelCreated(channel) {
    this.log('onDataChannelCreated: %o', channel);

    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      this.log('channel opened');
    };

    channel.onclose = () => {
      // Todo: signaling server broadcast to clients
      this.log('channel closed');
    };

    channel.onmessage = event => {
      this.log('received message: %o', event);

      const message = this._abToMessage(event.data);

      this.log('encoded array buffer %o', message);

      switch (message.messageType) {
        case this.messageTypes.refresh:
          this.refreshPeerResources(message.from, message.resourceHash);
          break;
        // Further cases ...
      }


      // console.log('WebRTC: client queue ', RESPONSE_QUEUE);
      //
      // const extractUrl = event.data && event.data.url || '';
      //
      // console.log('extracted url: ', extractUrl);
      //
      // const idx = RESPONSE_QUEUE.findIndex(res => res.url === extractUrl);
      //
      // // ATTENTION! HOTFIX, we need to map the data back to the request url
      // if (RESPONSE_QUEUE.length > 0) {
      //   // response and pass it back
      //   console.log('WRTC-Client: received a response for ', RESPONSE_QUEUE[RESPONSE_QUEUE.length-1]);
      //   RESPONSE_QUEUE[RESPONSE_QUEUE.length-1].callBack(event.data);
      //
      //   RESPONSE_QUEUE.pop()
      // } else {
      //   // ask own service worker
      //   console.log('WRTC-Client: ask my service worker for resource');
      //
      //   sendSyncedMessage(event.data).then(data => {
      //
      //     console.log('WRTC-Client: received the requested resource', data);
      //
      //     dataChannel.send(data);
      //   });
      // }
    };
  }

  _sendViaDataChannel(peer, message) {
    switch (peer.dataChannel.readyState) {
      case 'connecting':
        this.log('connection not open; queueing: %s', message);
        peer.requestQueue.push(message);
        break;
      case 'open':
        if (peer.requestQueue.length === 0) {
          peer.dataChannel.send(message);
        } else {
          peer.requestQueue.forEach(msg => peer.dataChannel.send(msg));
          peer.requestQueue = [];
        }
        break;
      case 'closing':
        this.log('attempted to send message while closing: %s', message);
        break;
      case 'closed':
        this.log('attempted to send while connection closed: %s', message);
        break;
    }
  }

  createPeerConnection(peerID, isInitiator = true) {
    this.log('creating connection as initiator? %s', isInitiator);

    const peer = {
      id: peerID,
      con: new RTCPeerConnection(this.stunServer),
      dataChannel: null,
      resources: [],
      requestQueue: [],
    };

    this.peers.push(peer);

    peer.con.onicecandidate = event => {
      this.log('icecandidate event: %o', event);

      if (event.candidate) {
        this.signal(peer.id, {
              type: 'candidate',
              label: event.candidate.sdpMLineIndex,
              id: event.candidate.sdpMid,
              candidate: event.candidate.candidate,
            }
        );
      }
    };

    if (isInitiator) {
      this.log('creating data channel');

      peer.dataChannel = peer.con.createDataChannel('data');
      this._onDataChannelCreated(peer.dataChannel);

      this.log('creating an offer');

      peer.con.createOffer().then(desc => {
        this._onLocalSessionCreated(peer.id, desc);
      });
    } else {
      peer.con.ondatachannel = event => {
        this.log('ondatachannel: %o', event.channel);

        peer.dataChannel = event.channel;
        this._onDataChannelCreated(peer.dataChannel);
      };
    }
  }

  messageCallback(peerId, message) {
    const peerExists = this._peerExists(peerId);

    if (!peerExists) {
      this.createPeerConnection(peerId, false);
    }

    const peer = this._getPeer(peerId);

    if (message.type === 'offer') {
      this.log('Got offer. Sending answer to peer.');
      peer.con.setRemoteDescription(message).then(() => {
        peer.con.createAnswer().then(desc => {
          this._onLocalSessionCreated(peer.id, desc);
        });
      });

    } else if (message.type === 'answer') {
      this.log('Got answer.');
      peer.con.setRemoteDescription(message);

    } else if (message.type === 'candidate') {
      peer.con.addIceCandidate(message).then(() => {
        this.log('Set addIceCandidate successfully');
      }).catch(e => this.log('error: %o', e));

    }
  }

  _toHex(buffer) {
    const hexCodes = [];
    const view = new DataView(buffer);
    for (let i = 0; i < view.byteLength; i += 4) {
      const value = view.getUint32(i);
      const stringValue = value.toString(16);
      const padding = '00000000';
      const paddedValue = (padding + stringValue).slice(-padding.length);

      hexCodes.push(paddedValue);
    }
    // Join all the hex strings into one
    return hexCodes.join('');
  }

  _sha256(str) {
    const buffer = new TextEncoder('utf-8').encode(str);

    return crypto.subtle.digest('SHA-256', buffer).then(hash => {
      return this._toHex(hash);
    });
  }

  _abTostr(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  _strToab(input) {
    let str = input;
    if (typeof input === 'number')
      str = input.toString();

    // const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    const buf = new ArrayBuffer(str.length); // 1 bytes for each char
    const bufView = new Uint8Array(buf);

    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }

    return buf;
  }

  _conacteAbs(abs) {
    let byteLength = 0;
    let length = 0;

    abs.forEach(ab => {
      byteLength += ab.byteLength
    });

    const result = new Uint8Array(byteLength);

    abs.forEach(ab => {
      result.set(new Uint8Array(ab), length);
      length += ab.byteLength;
    });

    return result;
  }

  _abToMessage(ab) {
    const message = {};
    const sizes = {type: 1, peerId: 24, resourceHash: 64};

    let chunkStart = 0;
    let chunkEnd = sizes.type;
    const typeAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

    chunkStart = chunkEnd;
    chunkEnd += sizes.peerId;
    const peerIdAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

    message.messageType = parseInt(this._abTostr(typeAb));
    message.from = this._abTostr(peerIdAb);

    switch (message.messageType) {
      case this.messageTypes.refresh:
        chunkStart = chunkEnd;
        chunkEnd += sizes.resourceHash;
        const resourceAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));
        message.resourceHash = this._abTostr(resourceAb);
        break;
        // further cases
    }

    return message;
  }

  broadcastPeers(url) {
    this._sha256(url).then(hash => {
      const typeAb = this._strToab(this.messageTypes.refresh);
      const fromAb = this._strToab(this.peerId);
      const dataAb = this._strToab(hash);
      const msg = this._conacteAbs([typeAb, fromAb, dataAb]);

      this.log('typeAb %o', typeAb);
      this.log('fromAb %o', fromAb);
      this.log('dataAb %o', dataAb);
      this.log('msg %o', msg);

      this.peers.forEach(peer => {
        this._sendViaDataChannel(peer, msg);
      });

    });

  }

  requestResource(url, cb) {
    this._sha256(url).then(hash => {
      const data = this._strToab(hash);

      this.log('hash %s', hash);
      this.log('array buffer %o', data);
    });

    this.log('try to find a peer for %s', url);

    const peers = this.peers.filter(p => p.resources.indexOf(url) >= 0);

    this.log('found %d peers', peers.length);

    // if(peers.length > 0) {
    //   // todo: choose random peer
    //   const peer = peers[0];
    //   const data = this._strToArrayBuffer(url);
    //
    //   // send request over datachannel
    //
    // } else {
    cb(undefined);
    // }
  }

  refreshPeerResources(peerId, resourceHash) {
    const peer = this._getPeer(peerId);

    this.log('peers %o', this.peers);

    if (!peer) {
      this.log('ERROR! Could not find peer!');
    }

    peer.resources.push(resourceHash);

    this.log('refreshed peer %s for resource %s', peerId, resourceHash);
  }

}

var WebRTC_old = function() {

  const RESPONSE_QUEUE = [];

  this.waitForResponse = function(url, cb) {
    const request = {};
    request.url = url;
    request.callBack = cb;

    RESPONSE_QUEUE.push(request);

    console.log('WebRTC: ask other peer');

    this.sendDataMessage(url);
  };

  var sendSyncedMessage = function(msg) {
    return new Promise(function(resolve, reject) {
      // Create a Message Channel
      var msg_chan = new MessageChannel();

      // Handler for recieving message reply from service worker
      msg_chan.port1.onmessage = function(event) {
        console.log('YEAH ', event.data);
        resolve(event.data);
      };

      console.log('WebRTC: ask my service worker for: ', msg);

      // Send message to service worker along with port for reply
      navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    });
  };

  this.getRequestFromPeer = function(url) {
    return sendSyncedMessage(url).then(function(response) {
      console.log('AND THE ANSWER IS:');
      console.log(response.data);
    });

  };
};
