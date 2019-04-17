class Peer {

  constructor(config) {
    this.config = config

    if(config.verbose) {
      this.log = getLogger('p2pCDN:peer');
      this.logDetail = getLogger('p2pCDN:peer:detail');
    } else {
      this.log = function(message) {}
    }

    this.signaling = new Signaling(config);
    this.serviceWorker = new ServiceWorkerMiddleware(config);

    this.stunServer = config.stunServer;
    this.peerId = this.config.clientId;
    this.peers = [];
    this.requests = [];
    this.cacheNotification = [];
    this.channel = config.channel;

    this.message = Object.freeze({
      types: {addedResource: 1, removedResource: 2, request: 3, chunk: 4, response: 5},
      sizes: { // in byte
        type: 1,
        peerId: config.idLength,
        hash: 64,
        chunkId: 8,
        chunkCount: 8,
        maxData: 65536,
      },
    });

    this._registerEvents();
  }

  _updateUI() {
    document.dispatchEvent(
        new CustomEvent(
          'ui:onUpdate',
          {
            detail:
            {
              peerId: this.peerId, peers: this.peers
            }
          }
        )
    );
  }

  _updateSW() {
    document.dispatchEvent(
        new CustomEvent('sw:clientReady')
    );
  }

  _onAddedResource(event) {
    this.updatePeers(event.detail, this.message.types.addedResource);
    this._updateUI();
  }

  _onRemovedResource(event) {
    this.updatePeers(event.detail, this.message.types.removedResource);
    this._updateUI();
  }

  _onNewConnection(event) {
    if(event.detail === this.peerId){
      return;
    }
    this.connectTo(event.detail);
    this._updateUI();
  }

  _onRequestResource(event) {
    const msg = event.detail;
    this.requestResourceFromPeers(msg.hash, msg.cb);
  }

  _onSignalingMessage(event) {
    const msg = event.detail;
    this.receiveSignalMessage(msg.peerId, msg.message)
    this._updateUI();
  }

  _registerEvents() {
    document.addEventListener('peer:onAddedResource', this._onAddedResource.bind(this));
    document.addEventListener('peer:onRemovedResource', this._onRemovedResource.bind(this));
    document.addEventListener('peer:onNewConnection', this._onNewConnection.bind(this));
    document.addEventListener('peer:onRequestResource', this._onRequestResource.bind(this));
    document.addEventListener('peer:onSignalingMessage', this._onSignalingMessage.bind(this));
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
    this.logDetail('local session created: %o', desc);

    const peer = this._getPeer(peerId);

    peer.con.setLocalDescription(desc).then(() => {
      this.logDetail('sending local desc: %o', peer.con.localDescription);
      this.signaling.send(peer.id, peer.con.localDescription);
    });
  }

  _getStateFor(peer) {
    return peer.dataChannel ? peer.dataChannel.readyState : 'connecting';
  }

  _sendViaDataChannel(peer, message) {
    const state = this._getStateFor(peer);

    switch (state) {
      case 'connecting':
        this.logDetail('connection not open; queueing: %s', message);
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
        this.logDetail('attempted to send message while closing: %s', message);
        break;
      case 'closed':
        this.logDetail('attempted to send while connection closed: %s', message);
        break;
    }
  }

  _sendToPeer(peer, msgType, hash, dataAb = undefined) {
    const typeAb = strToAb(msgType);
    var peerId = "0".repeat(this.message.sizes.peerId-this.peerId.toString().length) + this.peerId
    const fromAb = strToAb(peerId);
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

    this.log('Request resource %s from peer %s', hash, peer.id);
    this._sendToPeer(peer, msgType, hash);
    this.requests.push(request);
  }

  _addResource(peer, resource) {
    if (peer.resources.indexOf(resource) === -1) {
      peer.resources.push(resource);
      this._updateUI();
    }
  }

  _removeResource(peer, resource) {
    const index = peer.resources.indexOf(resource)
    if (index !== -1) {
      peer.resources.splice(index,1)
      this._updateUI();
    }
  }

  _checkCache() {
    // TODO: extract and write test
    const cb = cachedResources => {
      this.logDetail('cached resources %o', cachedResources);
      if (cachedResources && cachedResources.length > 0) {
        this.peers.forEach(peer => {
          const alreadySent = this.cacheNotification.indexOf(peer.id) >= 0;

          if (!alreadySent) {
            cachedResources.forEach(hash => {
              if (peer.dataChannel) {
                this.logDetail('update %s about cached resource %s', peer.id, hash);
                this.cacheNotification.push(peer.id);
                this._sendToPeer(peer, this.message.types.addedResource, hash);
              }
            });
          }
        });
      }
    };
    document.dispatchEvent(
        new CustomEvent('sw:onRequestCache', {detail: cb})
    );
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

    // Get response
    if (message.type === this.message.types.response) {
      chunkStart = chunkEnd;
      message.data = new Uint8Array(ab.slice(chunkStart));
    }

    return message;
  }

// TODO Adapt for delete
  _handleUpdate(message, type) {
    const peer = this._getPeer(message.from);
    if (!peer) {
      this.logDetail('Could not send update to peer');
      return;
    }

    this.logDetail('updated peer %s with resource %s', message.from, message.hash);
    if(type == this.message.types.addedResource){
      this._addResource(peer, message.hash);
      return;
    }
    this._removeResource(peer, message.hash);

  }

  _handleRequest(message){
    const cb = response => {
      this._handleResponse(message, response);
    };

    document.dispatchEvent(
        new CustomEvent('sw:onRequestResource', {detail: {
            hash: message.hash, cb: cb}
        })
    );
  }

  _handleResponse(message, responseAb) {
    const peer = this._getPeer(message.from);
    this.log('Sending request %s to peer: %s', message.hash, message.from)
    if (responseAb.byteLength <= this.message.sizes.maxData) {
      this._sendToPeer(peer, this.message.types.response, message.hash, responseAb);
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
      this.logDetail('error, could not find response!?');
    }
  }

  _sendChunkedToPeer(peer, hash, dataAb) {
    this.logDetail('have to chunk data %s', hash);
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
    this.logDetail('sent chunked data for %s', hash);
  }

  _concatMessage(chunks) {
    this.logDetail('concat message');

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
    this.logDetail('onDataChannelCreated: %o', channel);

    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      this.logDetail('data channel opened');
      this._checkCache();
    };

    channel.onclose = () => {
      this.logDetail('data channel closed');
    };

    channel.onmessage = event => {
      const message = this._abToMessage(event.data);
      const types =  this.message.types;

      this.logDetail('decoded message %o', message);

      // adapt for deletes
      switch (message.type) {
        case types.update:
          this._handleUpdate(message);
          break;
        case types.addedResource:
        case types.removedResource:
          this._handleUpdate(message, message.type);
          break
        case types.request:
          this._handleRequest(message);
          break;
        case types.chunk:
          this._handleChunk(message);
          break;
        case types.response:
          this._handleAnswer(message);
          break;
      }
    };
  }

  addPeer(peerID){
    const peer = {
      id: peerID,
      con: new RTCPeerConnection(this.stunServer),
      dataChannel: null,
      resources: [],
      requestQueue: [],
    };
    this.removePeer(peerID);

    this.peers.push(peer);

    return peer;
  }

  _peerDisconnected(e){

  }
  connectTo(peerID, isInitiator = true) {
    this.logDetail('creating connection as initiator? %s', isInitiator);

    const peer = this.addPeer(peerID);

    peer.con.onicecandidate = event => {
      this.logDetail('icecandidate event: %o', event);

      if (event.candidate) {
        this.signaling.send(peer.id, {
              type: 'candidate',
              label: event.candidate.sdpMLineIndex,
              id: event.candidate.sdpMid,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              candidate: event.candidate.candidate,
        });
      }
    };

    peer.con.oniceconnectionstatechange = event => {
      if(event.target.iceConnectionState == 'disconnected') {
        this.removePeer(peerID);
        console.logDetail('Disconnected');
      }
    }

    if (isInitiator) {
      this.logDetail('creating data channel');

      peer.dataChannel = peer.con.createDataChannel('data');
      this._onDataChannelCreated(peer.dataChannel);

      this.logDetail('creating an offer');

      peer.con.createOffer().then(desc => {
        this._onLocalSessionCreated(peer.id, desc);
      });

    } else {
      peer.con.ondatachannel = event => {
        this.log('established connection to peer: %s', peer.id)

        peer.dataChannel = event.channel;
        this._onDataChannelCreated(peer.dataChannel);
      };
    }
  }

  receiveSignalMessage(peerId, message) {
    //Todo: ensure that this never happens
    if(!peerId || peerId === this.peerId){
      return;
    }
    let peer = this._getPeer(peerId);

    // potential loop since connectTo calls this method
    if (!peer) {
      this.connectTo(peerId, false);
      peer = this._getPeer(peerId);
    }

    if (message.type === 'offer') {
      this.logDetail('Got offer %o. Sending answer to peer.', message);
      peer.con.setRemoteDescription(message).then(() => {
        peer.con.createAnswer().then(desc => {
          this._onLocalSessionCreated(peer.id, desc);
        });
      });

    } else if (message.type === 'answer') {
      this.logDetail('Got answer. %o', message);
      peer.con.setRemoteDescription(message);

    } else if (message.type === 'candidate') {
      peer.con.addIceCandidate(message).then(() => {
        this.logDetail('Set addIceCandidate successfully %o', message);
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
          this.logDetail('remove pending request from %s', peerId);
          this.requests.splice(i, 1);
        } else {
          i += 1;
        }
      }
    }
  }

// TODO adapt for deletes
  updatePeers(hash, msgType) {
    if(this.peers.length > 0) {
      this.logDetail('broadcast peers for %s', hash);
      this.peers.forEach(peer => {
        this._sendToPeer(peer, msgType, hash);
      });
    }
  }

  requestResourceFromPeers(hash, cb) {
    this.log('try to find a peer for resource %s', hash);
    const peers = this.peers.filter(p => p.resources.indexOf(hash) >= 0);
    const count = peers.length;

    this.logDetail('found %d peers', count);

    if (count > 0) {
      const randomPeerId = Math.floor(Math.random() * count);
      const peer = peers[randomPeerId];

      this._requestPeer(peer, this.message.types.request, hash, cb);
    } else {
      cb(undefined);
    }
  }
}
