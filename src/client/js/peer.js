class Peer {

  constructor(signalFunction, stunServer) {
    this.log = debug('openhpi:peer');
    this.log('setup');

    this.signal = signalFunction;
    this.stunServer = stunServer;
    this.peerId = undefined;
    this.onClose = undefined;
    this.onRequested = undefined;
    this.onUpdatePeers = undefined;

    this.peers = [];
    this.requests = [];
    this.resourceCache = [];
    this.discover = false;
    this.discoverRequestCount = 3;
    this.discoverPeerIds = [];
    this.discoveredPeers = [];

    this.message = Object.freeze({
      types: {discover: 1, update: 2, request: 3, chunk: 4, answer: 5},
      sizes: { // in byte
        type: 1,
        peerId: 24,
        hash: 64,
        chunkId: 8,
        chunkCount: 8,
        maxData: 65536,
      },
    });
  }

  _getPeerIdx(peerId) {
    return this.peers.map(p => p.id).indexOf(peerId);
  }

  _getPeer(peerId) {
    let idx = -1;

    for (let i = 0; i < this.peers.length; i++) {
      if (this.peers[i].id === peerId) {
        idx = i;
        break;
      }
    }

    if (idx >= 0)
      return this.peers[idx];
    return undefined;
  }

  _getRequestId(from, hash) {
    let idx = -1;

    for (let i = 0; i < this.requests.length; i++) {
      if (this.requests[i].from === from && this.requests[i].hash === hash) {
        idx = i;
        break;
      }
    }

    return idx;
  }

  _getRequest(from, hash) {
    const idx = this._getRequestId(from, hash);

    if (idx >= 0) {
      return this.requests[idx];
    }
    return undefined;
  }

  _removeRequest(from, hash) {
    const idx = this._getRequestId(from, hash);

    if (idx >= 0) {
      this.requests.splice(idx, 1);
    }
  }

  _onLocalSessionCreated(peerId, desc) {
    this.log('local session created: %o', desc);

    const peer = this._getPeer(peerId);

    peer.con.setLocalDescription(desc).then(() => {
      this.log('sending local desc: %o', peer.con.localDescription);
      this.signal(peer.id, peer.con.localDescription);
    });
  }

  _sendViaDataChannel(peer, message) {
    const state = peer.dataChannel.readyState || 'connecting';

    switch (state) {
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

  _sendToPeer(peer, msgType, hash, dataAb = undefined) {
    const typeAb = strToAb(msgType);
    const fromAb = strToAb(this.peerId);
    const hashAb = strToAb(hash);

    let msg;
    if (dataAb) {
      msg = concatAbs([typeAb, fromAb, hashAb, dataAb]);
    } else {
      msg = concatAbs([typeAb, fromAb, hashAb]);
    }

    this._sendViaDataChannel(peer, msg);
  }

  _requestPeer(peer, msgType, hash, cb) {
    const request = { from: peer.id, hash: hash, chunks: [], respond: cb };

    this.log('send request to peer %s', peer.id);
    this._sendToPeer(peer, msgType, hash);
    this.requests.push(request);
  }

  _addResource(peer, resource) {
    peer.resources.push(resource);

    if (typeof this.onUpdatePeers !== undefined){
      this.onUpdatePeers(this.peers);
    }
  }

  _setDiscoveredResources() {
    this.discoveredPeers.map(discoveredPeer => {
      const peerId = discoveredPeer.id;
      const connectedPeer = this._getPeer(peerId);

      if(connectedPeer){
        discoveredPeer.resources.map(r => {
          if (connectedPeer.resources.indexOf(r) === -1) {
            this.log('set resource %s of connected peer %s', r, peerId);
            this._addResource(connectedPeer, r);
          }
        });
      }
    });
  }

  _discoverPeers() {
    if(this.discover){
      let i = 0;
      while(i < this.discoverRequestCount && i < this.peers.length) {
        const randomPeerId = Math.floor(Math.random() * this.peers.length);
        const peer = this.peers[randomPeerId];
        const discoverType = this.message.types.discover;
        const timestamp = new Date().getTime().toString();
        const alreadyRequested = this.discoverPeerIds.indexOf(peer.id) >= 0;

        // only to peers with dataChannel
        if (peer.dataChannel && !alreadyRequested) {
          this.log('discover request to peer %s', peer.id);
          this.discoverPeerIds.push(peer.id);
          sha256(timestamp).then(hash => {
            // request discovery
            this._requestPeer(peer, discoverType, hash, (peersAb) => {
              const discoveredPeers = JSON.parse(abToStr(peersAb));
              const setDiscovered = discoveredPeers.length > this.discoveredPeers.length;

              this.log('discovered peers %o from %s', discoveredPeers, peer.id);

              if(setDiscovered){
                this.discoveredPeers = discoveredPeers;
                this._setDiscoveredResources();
              }
            });
          });
          this.discoverRequestCount -= 1;
          this.discover = this.discoverRequestCount > 0;
        }
        i +=1;
      }
    }
  }

  _abToMessage(ab) {
    const message = {
      type: null,
      from: null,
      hash: null,
      chunkId: null,
      chunkCount: null,
      data: null,
    };

    // Get type
    let chunkStart = 0;
    let chunkEnd = this.message.sizes.type;
    const typeAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

    // Get from
    chunkStart = chunkEnd;
    chunkEnd += this.message.sizes.peerId;
    const fromAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

    // Get hash
    chunkStart = chunkEnd;
    chunkEnd += this.message.sizes.hash;
    const resourceAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

    message.type = parseInt(abToStr(typeAb));
    message.from = abToStr(fromAb);
    message.hash = abToStr(resourceAb);

    // Get chunk
    if (message.type === this.message.types.chunk) {
      // Get chunkId
      chunkStart = chunkEnd;
      chunkEnd += this.message.sizes.chunkId;
      const chunkIdAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

      // Get chunkCount
      chunkStart = chunkEnd;
      chunkEnd += this.message.sizes.chunkCount;
      const chunkCountAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

      chunkStart = chunkEnd;
      message.data = new Uint8Array(ab.slice(chunkStart));
      message.chunkId = parseInt(abToStr(chunkIdAb));
      message.chunkCount = parseInt(abToStr(chunkCountAb));
    }

    // Get answer
    if (message.type === this.message.types.answer) {
      chunkStart = chunkEnd;
      message.data = new Uint8Array(ab.slice(chunkStart));
    }

    return message;
  }

  _handleDiscovery(message) {
    let discovery;
    if(this.resourceCache.length > 0){
      discovery = [{id: this.peerId, resources: this.resourceCache}];
      this.resourceCache = [];
    } else {
      discovery = this.peers.map(p => {
        return {id: p.id, resources: p.resources}
      });
    }
    const discoveryAb = strToAb(JSON.stringify(discovery));

    this._handleResponse(message, discoveryAb);
  }

  _handleUpdate(message) {
    const peer = this._getPeer(message.from);

    if (!peer) {
      this.log('ERROR! Could not find peer!');
    } else {
      this.log('updated peer %s with resource %s', message.from, message.hash);
      this._addResource(peer, message.hash)
    }
  }

  _handleResponse(message, responseAb) {
    const peer = this._getPeer(message.from);

    if (responseAb.byteLength <= this.message.sizes.maxData) {
      this._sendToPeer(peer, this.message.types.answer, message.hash, responseAb);
    } else {
      this._sendChunkedToPeer(peer, message.hash, responseAb);
    }
  }

  _handleChunk(message) {
    const req = this._getRequest(message.from, message.hash);

    req.chunks.push({id: message.chunkId, data: message.data});

    if(req.chunks.length === message.chunkCount) {
      this._removeRequest(message.from, message.hash);
      req.respond(this._concatMessage(req.chunks));
    }
  }

  _handleAnswer(message) {
    const req = this._getRequest(message.from, message.hash);

    if (req) {
      this._removeRequest(message.from, message.hash);
      req.respond(message.data);
    } else {
      this.log('error, could not find response!?');
    }
  }

  _sendChunkedToPeer(peer, hash, dataAb) {
    this.log('have to chunk data %s', hash);
    const s = this.message.sizes;
    const dataSize = dataAb.byteLength;
    const chunkSize = s.maxData - (s.peerId + s.hash + s.type + s.chunkId + s.chunkCount);
    const chunkCount = Math.ceil(dataSize / chunkSize);

    const applyPadding = (number, length) => {
      let result = number.toString();

      while(result.length < length) {
        result = '0' + result;
      }

      return result;
    };

    const buildChunk = (id, max, dataAb) => {
      const idAb = strToAb(id);
      const maxAb = strToAb(max);

      return concatAbs([idAb, maxAb, dataAb]);
    };

    let chunkEnd = chunkSize;
    let chunkId = 0;

    for (let i = 0; i < dataSize; i += chunkSize) {
      let chunkAb;
      if (i < dataSize) {
        chunkAb = new Uint8Array(dataAb.slice(i, chunkEnd));
      } else {
        chunkAb = new Uint8Array(dataAb.slice(i));
      }
      chunkEnd += chunkSize;

      const id = applyPadding(chunkId, s.chunkId);
      const count = applyPadding(chunkCount, s.chunkCount);
      const chunk = buildChunk(id, count, chunkAb);

      this._sendToPeer(peer, this.message.types.chunk, hash, chunk);
      chunkId += 1;
    }
    this.log('sent chunked data for %s', hash);
  }

  _concatMessage(chunks) {
    this.log('concat message');

    chunks.sort((a, b) => {
      if (a.id < b.id) {
        return -1;
      }
      if (a.id > b.id) {
        return 1;
      }
      return 0;
    });

    return concatAbs(chunks.map(c => c.data));
  }

  _onDataChannelCreated(channel) {
    this.log('onDataChannelCreated: %o', channel);

    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      this.log('data channel opened');
      this._discoverPeers();
    };

    channel.onclose = () => {
      this.log('data channel closed');
    };

    channel.onmessage = event => {
      const message = this._abToMessage(event.data);
      const types =  this.message.types;

      this.log('decoded message %o', message);

      switch (message.type) {
        case types.discover:
          this._handleDiscovery(message);
          break;
        case types.update:
          this._handleUpdate(message);
          break;
        case types.request:
          this.onRequested(message.hash, responseAb => {
            this._handleResponse(message, responseAb);
          });
          break;
        case types.chunk:
          this._handleChunk(message);
          break;
        case types.answer:
          this._handleAnswer(message);
          break;
      }
    };
  }

  connectTo(peerID, isInitiator = true) {
    this.log('creating connection as initiator? %s', isInitiator);

    const peer = {
      id: peerID,
      con: new RTCPeerConnection(this.stunServer),
      dataChannel: null,
      resources: [],
      requestQueue: [],
    };

    this.peers.push(peer);

    peer.con.onclose = this.onClose;
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
      this.discover = true;
      peer.con.ondatachannel = event => {
        this.log('ondatachannel: %o', event.channel);

        peer.dataChannel = event.channel;
        this._onDataChannelCreated(peer.dataChannel);
      };
    }
  }

  receiveSignalMessage(peerId, message) {
    let peer = this._getPeer(peerId);

    if (!peer) {
      this.connectTo(peerId, false);
      peer = this._getPeer(peerId);
    }

    if (message.type === 'offer') {
      this.log('Got offer %o. Sending answer to peer.', message);
      peer.con.setRemoteDescription(message).then(() => {
        peer.con.createAnswer().then(desc => {
          this._onLocalSessionCreated(peer.id, desc);
        });
      });

    } else if (message.type === 'answer') {
      this.log('Got answer. %o', message);
      peer.con.setRemoteDescription(message);

    } else if (message.type === 'candidate') {
      peer.con.addIceCandidate(message).then(() => {
        this.log('Set addIceCandidate successfully %o', message);
      }).catch(e => this.log('error: %o', e));

    }
  }

  removePeer(peerId) {
    const idx = this._getPeerIdx(peerId);

    if (idx >= 0) {
      this.log('remove peer %s', peerId);
      this.peers[idx].con.close();
      this.peers.splice(idx, 1);

      let i = 0;
      while(i < this.requests.length){
        const req = this.requests[i];

        if(req.from === peerId){
          this.log('remove pending request from %s', peerId);
          this.requests.splice(i, 1);
        } else {
          i += 1;
        }
      }
    }
  }

  updatePeers(hash) {
    if(this.peers.length === 0) {
      this.log('no peer connections, use resource cache for %s', hash);
      this.resourceCache.push(hash);
    } else {
      this.log('broadcast peers for %s', hash);
      this.peers.forEach(peer => {
        this._sendToPeer(peer, this.message.types.update, hash);
      });
    }
  }

  requestResourceFromPeers(hash, cb) {
    this.log('try to find a peer for %s', hash);
    const peers = this.peers.filter(p => p.resources.indexOf(hash) >= 0);
    const count = peers.length;

    this.log('found %d peers', count);

    if (count > 0) {
      const randomPeerId = Math.floor(Math.random() * count);
      const peer = peers[randomPeerId];

      this._requestPeer(peer, this.message.types.request, hash, cb);
    } else {
      cb(undefined);
    }
  }
}