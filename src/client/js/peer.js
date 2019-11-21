class Peer {

  constructor(config) {
    this.config = config

    if(config.verbose) {
      this.log = getLogger('p2pCDN:peer');
      this.logDetail = getLogger('p2pCDN:peer:detail');
    } else {
      this.log = function(message) {}
      this.logDetail = function (_) {}
    }

    this.signaling = new Signaling(config);
    this.serviceWorker = new ServiceWorkerMiddleware(config);
    this.stunServer = { iceServers: [] }
    if(config.stunServer &&
      config.stunServer.iceServers.length !== 0 &&
      config.stunServer.iceServers[0].urls !== '') {
      this.stunServer = config.stunServer;
    }
    this.peerId = this.config.clientId;
    this.peers = [];
    this.requests = [];
    this.channel = config.channel;
    this.pendingResourceRequests = {};

    this.message = Object.freeze({
      types: {
        addedResource: 1,
        removedResource: 2,
        startedDownload: 3,
        request: 4,
        chunk: 5,
        response: 6
      },
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
    if(typeof peer.con === 'undefined') return;
    peer.con.setLocalDescription(desc).then(() => {
      if(typeof peer.con === 'undefined') return;
      this.logDetail('sending local desc: %o', peer.con.localDescription);
      this.signaling.send(peer.id, peer.con.localDescription);
    });
  }

  _getStateFor(peer) {
    return peer.dataChannel ? peer.dataChannel.readyState : 'connecting';
  }

  _sendViaDataChannel(peer, message) {
    const state = this._getStateFor(peer);
    var send = function(msg) {
      try{
        // maximum buffer size is 16mb
        if(peer.dataChannel.bufferedAmount <= 16000000) {
          peer.dataChannel.send(msg);
          return;
        }
        // if maximum buffersize is reached delay sending of chunks
        peer.requestQueue.push(msg);
        peer.dataChannel.bufferedAmountLowThreshold = 65536;
        peer.dataChannel.onbufferedamountlow = function () {
          var reqs = peer.requestQueue.slice();
          peer.requestQueue = [];
          reqs.forEach(_msg => send(_msg));
        }
      } catch(error) {
        if (console) {
          console.log(error);
        }
      }
    }
    switch (state) {
      case 'connecting':
        this.logDetail('connection not open; queueing: %s', message);
        peer.requestQueue.push(message);
        break;
      case 'open':
        send(message);
        if(peer.requestQueue.size >= 1) {
          peer.requestQueue.forEach(msg => send(msg));
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
    var peerId = "0".repeat(this.message.sizes.peerId-this.peerId.toString().length) + this.peerId;
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

    // Remove request after timeout to prevent dangling requests
    setTimeout(() => {
      request.respond({'error': 'Not finished in time'})
      this._removeRequest(peer.id, hash);
    }, 20000)
  }

  _addResource(peer, resource) {
    if (peer.resources.indexOf(resource) === -1) {
      peer.resources.push(resource);
      const index = peer.downloadingResources.indexOf(resource);
      if (index !== -1) {
        this._triggerPendingRequestsFor(peer, resource);
        peer.downloadingResources.splice(index, 1);
      }
      this._updateUI();
    }
  }

  _addResourcesFrom(peer, resources) {
    for(var i = 0; i < resources.length; i += 1) {
      this._addResource(peer, resources[i]);
    }
  }

  _startedDownloadFrom(peer, resource) {
    this.log('Peer %s started to download resource %s', peer.id, resource)
    peer.downloadingResources.push(resource)
  }

  _removeResourceFrom(peer, resource) {
    const index = peer.resources.indexOf(resource)
    if (index !== -1) {
      peer.resources.splice(index,1)
      this._updateUI();
    }
  }

  _checkCache(peer) {
    const cb = cachedResources => {
      this.logDetail('cached resources %o', cachedResources);
      if (cachedResources && cachedResources.length > 0) {
        if (peer.dataChannel) {
          this.logDetail('update %s about cached resources', peer.id);
          this._sendToPeer(peer, this.message.types.addedResource, cachedResources[0], strToAb(cachedResources.toString()));
        }
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
    if (message.type === this.message.types.response || message.type === this.message.types.addedResource) {
      chunkStart = chunkEnd;
      message.data = new Uint8Array(ab.slice(chunkStart));
    }

    return message;
  }

  _triggerPendingRequestsFor(peer, resource) {
    const pendingRequests = this.pendingResourceRequests[peer.id];
    if (typeof pendingRequests === 'undefined' ||
      typeof pendingRequests[resource] === 'undefined') {
      return;
    }
    const resourceRequest = pendingRequests[resource]
    this.requestResourceFromPeers(resource, resourceRequest.cb);
    delete this.pendingResourceRequests[peer.id][resource]
  }

  _handleUpdate(message, type) {
    const peer = this._getPeer(message.from);
    if (!peer) {
      this.logDetail('Could not send update to peer');
      return;
    }

    this.logDetail('updated peer %s with resource %s', message.from, message.hash);
    if(type === this.message.types.addedResource){
      this._addResourcesFrom(peer, abToStr(message.data).split(','));
      return;
    }
    if(type === this.message.types.startedDownload) {
      this._startedDownloadFrom(peer, message.hash);
      return;
    }
    this._removeResourceFrom(peer, message.hash);
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
    if (typeof responseAb === 'undefined' || responseAb.byteLength <= this.message.sizes.maxData) {
      this._sendToPeer(peer, this.message.types.response, message.hash, responseAb);
    } else {
      this._sendChunkedToPeer(peer, message.hash, responseAb);
    }
  }

  _handleChunk(message) {
    // this code leads to problems when a peer requests the same resource from the same peer at the same time
    const req = this._getRequest(message.from, message.hash);
    var response = {}
    if (typeof req === 'undefined') return;
    req.chunks.push({id: message.chunkId, data: message.data});

    if(req.chunks.length === message.chunkCount) {
      response.data = this._concatMessage(req.chunks)
      response.from = message.from;
      response.peerId = this.peerId;
      this._removeRequest(message.from, message.hash);
      req.respond(response);
    }
  }

  _handleAnswer(message) {
    const req = this._getRequest(message.from, message.hash);

    if (req) {
      this._removeRequest(message.from, message.hash);
      message.peerId = this.peerId
      req.respond(message)
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

  _onDataChannelCreated(peer) {
    var channel = peer.dataChannel;
    this.logDetail('onDataChannelCreated: %o', channel);

    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      this.logDetail('data channel opened');
      this._checkCache(peer);
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
        case types.startedDownload:
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
      downloadingResources: []
    };
    this.removePeer(peerID);

    this.peers.push(peer);

    return peer;
  }

  connectTo(peerID, isInitiator = true) {
    var peer;
    this.logDetail('creating connection as initiator? %s', isInitiator);
    peer = this.addPeer(peerID);

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
      if(event.target.iceConnectionState === 'disconnected' || event.target.iceConnectionState === 'closed') {
        this.removePeer(peerID);
        this.logDetail(event.target.iceConnectionState);
      }
    }

    if (isInitiator) {
      this.logDetail('creating data channel');
      peer.dataChannel = peer.con.createDataChannel('data');
      this._onDataChannelCreated(peer);

      this.logDetail('creating an offer');
      peer.con.createOffer().then(desc => {
        this._onLocalSessionCreated(peer.id, desc);
      });
    } else {
      peer.con.ondatachannel = event => {
        this.log('established connection to peer: %s', peer.id)

        peer.dataChannel = event.channel;
        this._onDataChannelCreated(peer);
      };
    }
  }

  _handleCreateDescriptionError(error) {
    if(console) {
      console.log("Failed to establish peer connection: " + error)
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
    if(typeof peer.con === 'undefined') return;

    if (message.type === 'offer') {
      this.logDetail('Got offer %o. Sending answer to peer.', message);
      peer.con.setRemoteDescription(message).then(() => {
        if(typeof peer.con === 'undefined') return;
        peer.con.createAnswer().then(desc => {
          this._onLocalSessionCreated(peer.id, desc);
        });
      }).catch(this._handleCreateDescriptionError);

    } else if (message.type === 'answer') {
      this.logDetail('Got answer. %o', message);
      peer.con.setRemoteDescription(message).catch(this._handleCreateDescriptionError);

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
      let con = this.peers[idx].con;
      this.peers[idx].con = null;
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
      con.close();
    }
  }

  updatePeers(hash, msgType) {
    if(this.peers.length > 0) {
      this.logDetail('broadcast peers for %s', hash);
      this.peers.forEach(peer => {
        this._sendToPeer(peer, msgType, hash, strToAb(hash));
      });
    }
  }
  _currentlyDownloading(resource) {
    const peers = this.peers
      .filter(p => p.downloadingResources.indexOf(resource) >= 0);
    return peers;
  }

  requestResourceFromPeers(hash, cb) {
    this.log('try to find a peer for resource %s', hash);
    var peers = this.peers.filter(p => p.resources.indexOf(hash) >= 0);
    var count = peers.length;
    this.logDetail('found %d peers', count);

    if (count > 0) {
      const randomPeerId = Math.floor(Math.random() * count);
      const peer = peers[randomPeerId];
      this._requestPeer(peer, this.message.types.request, hash, cb);
    } else {
      const randomPeerId = Math.floor(Math.random() * count);
      peers = this._currentlyDownloading(hash)
      count = peers.length
      if(count > 0) {
        const peer = peers[randomPeerId];
        if(typeof this.pendingResourceRequests[peer.id] === 'undefined') {
          this.pendingResourceRequests[peer.id] = { }
        }
        this.pendingResourceRequests[peer.id][hash] = { 'cb': cb }

        // Send a downloading message to other peers even if you are waiting
        // for another download to be finished. Prevents a situation where
        // all peers are trying to download the resource from a single client
        this.updatePeers(hash, this.message.types.startedDownload);
      } else {
        this.updatePeers(hash, this.message.types.startedDownload);
        cb(undefined);
      }
    }
  }
}
