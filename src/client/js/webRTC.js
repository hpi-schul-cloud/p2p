class WebRTC {

  constructor(signalFunction, stunServer) {
    this.log = debug('openhpi:webRTC');
    this.log('setup');

    this.signal = signalFunction;
    this.stunServer = stunServer;
    this.peerId = null;
    this.onRequested = null;
    this.peers = [];
    this.requests = [];
    this.messageTypes = Object.freeze({
      "update": 1, "request": 2, "chunk": 3, "answer": 4
    });
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

  _getRequest(from, hash) {
    let idx = -1;

    for (let i = 0; i < this.requests.length; i++) {
      if(this.requests[i].from === from && this.requests[i].hash === hash) {
        idx = i;
        break;
      }
    }

    if (idx >= 0) {
      const req = this.requests[idx];

      this.requests = this.requests.slice(idx, 1); // delete request from cache
      return req;
    }
    return undefined;
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

      switch (message.type) {
        case this.messageTypes.update:
          this.refreshPeerResources(message.from, message.hash);
          break;
        case this.messageTypes.request:
          this.log('received a request ...');
          this.onRequested(message.hash, response => {
            const peer = this._getPeer(message.from);

            this._sendToPeer(peer, this.messageTypes.answer, message.hash, response);
          });
          break;
        case this.messageTypes.chunk:
          this.log('received an chunk ...');
          // to implement
          break;
        case this.messageTypes.answer:
          const res = this._getRequest(message.from, message.hash);

          if(res) {
            res.response(message.data);
          } else {
            this.log('error, could not find response!?')
          }
          break;
      }
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

  static _abTostr(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  static _strToab(input) {
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
    const message = {type: null, from: null, hash: null, data: null};
    const sizes = {type: 1, peerId: 24, hash: 64};

    // Get type
    let chunkStart = 0;
    let chunkEnd = sizes.type;
    const typeAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

    // Get from
    chunkStart = chunkEnd;
    chunkEnd += sizes.peerId;
    const fromAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

    // Get hash
    chunkStart = chunkEnd;
    chunkEnd += sizes.hash;
    const resourceAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

    message.type = parseInt(WebRTC._abTostr(typeAb));
    message.from = WebRTC._abTostr(fromAb);
    message.hash = WebRTC._abTostr(resourceAb);

    // Get data
    if(message.type === this.messageTypes.answer) {
      chunkStart = chunkEnd;
      message.data = new Uint8Array(ab.slice(chunkStart));
    }

    return message;
  }

  _sendToPeer(peer, msgType, hash, data = undefined) {
    const typeAb = WebRTC._strToab(msgType);
    const fromAb = WebRTC._strToab(this.peerId);
    const hashAb = WebRTC._strToab(hash);

    let msg;
    if(data) {
      msg = this._conacteAbs([typeAb, fromAb, hashAb, data]);
    } else {
      msg = this._conacteAbs([typeAb, fromAb, hashAb]);
    }

    // this.log('typeAb %o', typeAb);
    // this.log('fromAb %o', fromAb);
    // this.log('dataAb %o', data);
    // this.log('msg %o', msg);

    this._sendViaDataChannel(peer, msg);
  }

  updatePeers(hash) {
    this.log('broadcast peers for %s', hash);

    this.peers.forEach(peer => {
      this._sendToPeer(peer, this.messageTypes.update, hash);
    });
  }

  requestPeer(hash, cb) {
    this.log('try to find a peer for %s', hash);

    const peers = this.peers.filter(p => p.resources.indexOf(hash) >= 0);
    const count = peers.length;

    this.log('found %d peers', count);

    if(count > 0) {
      const randomPeerId = Math.floor(Math.random() * count);
      const peer = peers[randomPeerId];
      const request = {
        from: peer.id,
        hash: hash,
        response: cb
      };
      this.log('send request to other peer');
      this._sendToPeer(peer, this.messageTypes.request, hash);
      this.requests.push(request);
    } else {
      cb(undefined);
    }
  }

  refreshPeerResources(peerId, hash) {
    const peer = this._getPeer(peerId);

    if (!peer) {
      this.log('ERROR! Could not find peer!');
    }

    peer.resources.push(hash);

    this.log('updated peer %s with resource %s', peerId, hash);
  }

}