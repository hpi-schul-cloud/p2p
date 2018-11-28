'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ServiceWorkerMiddleware = function () {
  function ServiceWorkerMiddleware(config) {
    _classCallCheck(this, ServiceWorkerMiddleware);

    this.log = getLogger('openhpi:ServiceWorkerMiddleware');
    this.log('setup');
    this._initServiceWorker(config.serviceWorker);
  }

  _createClass(ServiceWorkerMiddleware, [{
    key: '_initServiceWorker',
    value: function _initServiceWorker(swConfig) {
      var _this = this;

      var sw = navigator.serviceWorker || {};

      if (typeof sw === 'undefined' || typeof idbKeyval === 'undefined') {
        return false;
      }

      idbKeyval.set('swConfig', swConfig).then(function () {
        window.addEventListener('load', function () {
          if (sw.controller) {
            _this.log('serviceWorker already registered');
          } else {
            sw.register(swConfig.path, { scope: swConfig.scope }).then(function (registration) {
              _this.log('registration successful, scope: %s', registration.scope);
            }, function (err) {
              _this.log('registration failed: %s', err);
            });
          }
        });
      });
      this._initListeners();
    }
  }, {
    key: '_onRequest',
    value: function _onRequest(hash, cb) {
      var msg = { hash: hash, cb: cb };

      document.dispatchEvent(new CustomEvent('peer:onRequestResource', { detail: msg }));
    }
  }, {
    key: '_onUpdate',
    value: function _onUpdate(hash) {
      document.dispatchEvent(new CustomEvent('peer:onUpdatePeers', { detail: hash }));
    }
  }, {
    key: '_onAddedResource',
    value: function _onAddedResource(hash) {
      document.dispatchEvent(new CustomEvent('peer:onAddedResource', { detail: hash }));
    }
  }, {
    key: '_onRemovedResource',
    value: function _onRemovedResource(hash) {
      document.dispatchEvent(new CustomEvent('peer:onRemovedResource', { detail: hash }));
    }
  }, {
    key: '_onServiceWorkerMessage',
    value: function _onServiceWorkerMessage(event) {
      var _this2 = this;

      this.log('received request for: %o', event.data);

      if (event.data.type === 'addedResource') {
        this._onAddedResource(event.data.hash);
      } else if (event.data.type === 'removedResource') {
        this._onRemovedResource(event.data.hash);
      } else if (event.data.type === 'request') {
        var reply = function reply(response) {
          _this2.log('have received something: %s', response);
          event.ports[0].postMessage(response);
        };
        this._onRequest(event.data.hash, reply);
      } else {
        this.log('cant match request!');
      }
    }
  }, {
    key: '_onClientReady',
    value: function _onClientReady() {
      var msg = { type: 'status', msg: 'ready' };
      this.messageToServiceWorker(msg);
    }
  }, {
    key: '_onRequestCache',
    value: function _onRequestCache(event) {
      var msg = { type: "cache" };
      this.messageToServiceWorker(msg).then(function (cachedResources) {
        event.detail(cachedResources);
      });
    }
  }, {
    key: '_onRequestResource',
    value: function _onRequestResource(event) {
      var msg = { type: "resource", resource: event.detail.hash };

      this.messageToServiceWorker(msg).then(function (resource) {
        event.detail.cb(resource);
      });
    }
  }, {
    key: '_initListeners',
    value: function _initListeners() {
      navigator.serviceWorker.addEventListener('message', this._onServiceWorkerMessage.bind(this));

      document.addEventListener('sw:clientReady', this._onClientReady.bind(this));

      document.addEventListener('sw:onRequestCache', this._onRequestCache.bind(this));

      document.addEventListener('sw:onRequestResource', this._onRequestResource.bind(this));
    }
  }, {
    key: 'messageToServiceWorker',
    value: function messageToServiceWorker(msg) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (!navigator.serviceWorker.controller) {
          resolve(undefined);
          return;
        }
        var msg_chan = new MessageChannel();
        // Handler for receiving message reply from service worker
        msg_chan.port1.onmessage = function (event) {
          if (event.data.error) {
            reject(event.data.error);
          } else {
            resolve(event.data);
          }
        };

        _this3.log('ask service worker for %o', msg);
        // Send message to service worker along with port for reply
        navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
      });
    }
  }]);

  return ServiceWorkerMiddleware;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Signaling = function () {
  function Signaling() {
    _classCallCheck(this, Signaling);

    this.log = getLogger('openhpi:client-signaling');
    this.log('setup');
    this.socket = io.connect(window.location.href, { forceNew: true });
    this._dispatcher();
  }

  _createClass(Signaling, [{
    key: '_dispatcher',
    value: function _dispatcher() {
      this.socket.on('created', this._onCreated.bind(this));
      this.socket.on('joined', this._onJoined.bind(this));
      this.socket.on('closed', this._onClosed.bind(this));
      this.socket.on('ready', this._onReady.bind(this));
      this.socket.on('message', this._onMessage.bind(this));
    }
  }, {
    key: '_onCreated',
    value: function _onCreated(channel, peerId) {
      this.log('created channel %s, peerId %s', channel, peerId);

      document.dispatchEvent(new CustomEvent('peer:onReceiveId', { detail: peerId }));
    }
  }, {
    key: '_onJoined',
    value: function _onJoined(channel, peerId) {
      this.log('joined channel %s, peerId %s ', channel, peerId);

      document.dispatchEvent(new CustomEvent('peer:onReceiveId', { detail: peerId }));
    }
  }, {
    key: '_onReady',
    value: function _onReady(peerId) {
      this.log('client %s has been joined.', peerId);
      document.dispatchEvent(new CustomEvent('peer:onNewConnection', { detail: peerId }));
    }
  }, {
    key: '_onMessage',
    value: function _onMessage(from, message) {
      this.log('received message %o from %s', message, from);
      document.dispatchEvent(new CustomEvent('peer:onSignalingMessage', { detail: { message: message, peerId: from } }));
    }
  }, {
    key: '_onClosed',
    value: function _onClosed(peerId) {
      this.log('peer %s closed connection', peerId);
      document.dispatchEvent(new CustomEvent('peer:onClose', { detail: peerId }));
    }
  }, {
    key: 'hello',
    value: function hello(channel) {
      this.log('send hello for channel %s', channel);
      this.socket.emit('hello', channel);
    }
  }, {
    key: 'send',
    value: function send(to, message) {
      this.log('send message %o to client %s', message, to);
      this.socket.emit('message', to, message);
    }
  }]);

  return Signaling;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Peer = function () {
  function Peer(config) {
    _classCallCheck(this, Peer);

    this.config = config;
    this.log = getLogger('openhpi:peer');
    this.log('setup');

    this.signaling = new Signaling();
    this.serviceWorker = new ServiceWorkerMiddleware(config);

    this.stunServer = config.stunServer;
    this.peerId = undefined;
    this.peers = [];
    this.requests = [];
    this.cacheNotification = [];
    this.channel = config.channel;

    this.message = Object.freeze({
      types: { addedResource: 1, removedResource: 2, request: 3, chunk: 4, response: 5 },
      sizes: { // in byte
        type: 1,
        peerId: 24,
        hash: 64,
        chunkId: 8,
        chunkCount: 8,
        maxData: 65536
      }
    });

    this._registerEvents();

    // Send handshake to server
    this.signaling.hello(this.channel);
  }

  _createClass(Peer, [{
    key: '_updateUI',
    value: function _updateUI() {
      document.dispatchEvent(new CustomEvent('ui:onUpdate', {
        detail: {
          peerId: this.peerId, peers: this.peers
        }
      }));
    }
  }, {
    key: '_updateSW',
    value: function _updateSW() {
      document.dispatchEvent(new CustomEvent('sw:clientReady'));
    }
  }, {
    key: '_onReceiveId',
    value: function _onReceiveId(event) {
      this.peerId = event.detail;
      this._updateUI();
      this._updateSW();
    }
  }, {
    key: '_onAddedResource',
    value: function _onAddedResource(event) {
      this.updatePeers(event.detail, this.message.types.addedResource);
      this._updateUI();
    }
  }, {
    key: '_onRemovedResource',
    value: function _onRemovedResource(event) {
      this.updatePeers(event.detail, this.message.types.removedResource);
      this._updateUI();
    }
  }, {
    key: '_onNewConnection',
    value: function _onNewConnection(event) {
      this.connectTo(event.detail);
      this._updateUI();
    }
  }, {
    key: '_onRequestResource',
    value: function _onRequestResource(event) {
      var msg = event.detail;
      this.requestResourceFromPeers(msg.hash, msg.cb);
    }
  }, {
    key: '_onSignalingMessage',
    value: function _onSignalingMessage(event) {
      var msg = event.detail;
      this.receiveSignalMessage(msg.peerId, msg.message);
      this._updateUI();
    }
  }, {
    key: '_onClosed',
    value: function _onClosed(event) {
      this.removePeer(event.detail);
      this._updateUI();
    }
  }, {
    key: '_registerEvents',
    value: function _registerEvents() {
      document.addEventListener('peer:onReceiveId', this._onReceiveId.bind(this));
      document.addEventListener('peer:onAddedResource', this._onAddedResource.bind(this));
      document.addEventListener('peer:onRemovedResource', this._onRemovedResource.bind(this));
      document.addEventListener('peer:onNewConnection', this._onNewConnection.bind(this));
      document.addEventListener('peer:onRequestResource', this._onRequestResource.bind(this));
      document.addEventListener('peer:onSignalingMessage', this._onSignalingMessage.bind(this));
      document.addEventListener('peer:onClose', this._onClosed.bind(this));
    }
  }, {
    key: '_getPeerIdx',
    value: function _getPeerIdx(peerId) {
      return this.peers.map(function (p) {
        return p.id;
      }).indexOf(peerId);
    }
  }, {
    key: '_getPeer',
    value: function _getPeer(peerId) {
      var idx = -1;

      for (var i = 0; i < this.peers.length; i++) {
        if (this.peers[i].id === peerId) {
          idx = i;
          break;
        }
      }

      if (idx >= 0) return this.peers[idx];
      return undefined;
    }
  }, {
    key: '_getRequestId',
    value: function _getRequestId(from, hash) {
      var idx = -1;

      for (var i = 0; i < this.requests.length; i++) {
        if (this.requests[i].from === from && this.requests[i].hash === hash) {
          idx = i;
          break;
        }
      }

      return idx;
    }
  }, {
    key: '_getRequest',
    value: function _getRequest(from, hash) {
      var idx = this._getRequestId(from, hash);

      if (idx >= 0) {
        return this.requests[idx];
      }
      return undefined;
    }
  }, {
    key: '_removeRequest',
    value: function _removeRequest(from, hash) {
      var idx = this._getRequestId(from, hash);

      if (idx >= 0) {
        this.requests.splice(idx, 1);
      }
    }
  }, {
    key: '_onLocalSessionCreated',
    value: function _onLocalSessionCreated(peerId, desc) {
      var _this = this;

      this.log('local session created: %o', desc);

      var peer = this._getPeer(peerId);

      peer.con.setLocalDescription(desc).then(function () {
        _this.log('sending local desc: %o', peer.con.localDescription);
        _this.signaling.send(peer.id, peer.con.localDescription);
      });
    }
  }, {
    key: '_sendViaDataChannel',
    value: function _sendViaDataChannel(peer, message) {
      var state = peer.dataChannel ? peer.dataChannel.readyState : 'connecting';

      switch (state) {
        case 'connecting':
          this.log('connection not open; queueing: %s', message);
          peer.requestQueue.push(message);
          break;
        case 'open':
          if (peer.requestQueue.length === 0) {
            peer.dataChannel.send(message);
          } else {
            peer.requestQueue.forEach(function (msg) {
              return peer.dataChannel.send(msg);
            });
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
  }, {
    key: '_sendToPeer',
    value: function _sendToPeer(peer, msgType, hash) {
      var dataAb = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;

      var typeAb = strToAb(msgType);
      var fromAb = strToAb(this.peerId);
      var hashAb = strToAb(hash);

      var msg = void 0;
      if (dataAb) {
        msg = concatAbs([typeAb, fromAb, hashAb, dataAb]);
      } else {
        msg = concatAbs([typeAb, fromAb, hashAb]);
      }

      this._sendViaDataChannel(peer, msg);
    }
  }, {
    key: '_requestPeer',
    value: function _requestPeer(peer, msgType, hash, cb) {
      var request = { from: peer.id, hash: hash, chunks: [], respond: cb };

      this.log('send request to peer %s', peer.id);
      this._sendToPeer(peer, msgType, hash);
      this.requests.push(request);
    }
  }, {
    key: '_addResource',
    value: function _addResource(peer, resource) {
      if (peer.resources.indexOf(resource) === -1) {
        peer.resources.push(resource);
        this._updateUI();
      }
    }
  }, {
    key: '_removeResource',
    value: function _removeResource(peer, resource) {
      var index = peer.resources.indexOf(resource);
      if (index !== -1) {
        peer.resources.splice(index, 1);
        this._updateUI();
      }
    }
  }, {
    key: '_checkCache',
    value: function _checkCache() {
      var _this2 = this;

      // TODO: extract and write test
      var cb = function cb(cachedResources) {
        _this2.log('cached resources %o', cachedResources);
        if (cachedResources && cachedResources.length > 0) {
          _this2.peers.forEach(function (peer) {
            var alreadySent = _this2.cacheNotification.indexOf(peer.id) >= 0;

            if (!alreadySent) {
              cachedResources.forEach(function (hash) {
                if (peer.dataChannel) {
                  _this2.log('update %s about cached resource %s', peer.id, hash);
                  _this2.cacheNotification.push(peer.id);
                  _this2._sendToPeer(peer, _this2.message.types.addedResource, hash);
                }
              });
            }
          });
        }
      };
      document.dispatchEvent(new CustomEvent('sw:onRequestCache', { detail: cb }));
    }
  }, {
    key: '_abToMessage',
    value: function _abToMessage(ab) {
      var message = {
        type: null,
        from: null,
        hash: null,
        chunkId: null,
        chunkCount: null,
        data: null
      };

      // Get type
      var chunkStart = 0;
      var chunkEnd = this.message.sizes.type;
      var typeAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

      // Get from
      chunkStart = chunkEnd;
      chunkEnd += this.message.sizes.peerId;
      var fromAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

      // Get hash
      chunkStart = chunkEnd;
      chunkEnd += this.message.sizes.hash;
      var resourceAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

      message.type = parseInt(abToStr(typeAb));
      message.from = abToStr(fromAb);
      message.hash = abToStr(resourceAb);

      // Get chunk
      if (message.type === this.message.types.chunk) {
        // Get chunkId
        chunkStart = chunkEnd;
        chunkEnd += this.message.sizes.chunkId;
        var chunkIdAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

        // Get chunkCount
        chunkStart = chunkEnd;
        chunkEnd += this.message.sizes.chunkCount;
        var chunkCountAb = new Uint8Array(ab.slice(chunkStart, chunkEnd));

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

  }, {
    key: '_handleUpdate',
    value: function _handleUpdate(message, type) {
      var peer = this._getPeer(message.from);
      if (!peer) {
        this.log('ERROR! Could not find peer!');
        return;
      }

      this.log('updated peer %s with resource %s', message.from, message.hash);
      if (type == this.message.types.addedResource) {
        this._addResource(peer, message.hash);
        return;
      }
      this._removeResource(peer, message.hash);
    }
  }, {
    key: '_handleRequest',
    value: function _handleRequest(message) {
      var _this3 = this;

      var cb = function cb(response) {
        _this3._handleResponse(message, response);
      };

      document.dispatchEvent(new CustomEvent('sw:onRequestResource', { detail: {
          hash: message.hash, cb: cb }
      }));
    }
  }, {
    key: '_handleResponse',
    value: function _handleResponse(message, responseAb) {
      var peer = this._getPeer(message.from);
      if (responseAb.byteLength <= this.message.sizes.maxData) {
        this._sendToPeer(peer, this.message.types.response, message.hash, responseAb);
      } else {
        this._sendChunkedToPeer(peer, message.hash, responseAb);
      }
    }
  }, {
    key: '_handleChunk',
    value: function _handleChunk(message) {
      var req = this._getRequest(message.from, message.hash);

      req.chunks.push({ id: message.chunkId, data: message.data });

      if (req.chunks.length === message.chunkCount) {
        this._removeRequest(message.from, message.hash);
        req.respond(this._concatMessage(req.chunks));
      }
    }
  }, {
    key: '_handleAnswer',
    value: function _handleAnswer(message) {
      var req = this._getRequest(message.from, message.hash);

      if (req) {
        this._removeRequest(message.from, message.hash);
        req.respond(message.data);
      } else {
        this.log('error, could not find response!?');
      }
    }
  }, {
    key: '_sendChunkedToPeer',
    value: function _sendChunkedToPeer(peer, hash, dataAb) {
      this.log('have to chunk data %s', hash);
      var s = this.message.sizes;
      var dataSize = dataAb.byteLength;
      var chunkSize = s.maxData - (s.peerId + s.hash + s.type + s.chunkId + s.chunkCount);
      var chunkCount = Math.ceil(dataSize / chunkSize);

      var applyPadding = function applyPadding(number, length) {
        var result = number.toString();

        while (result.length < length) {
          result = '0' + result;
        }

        return result;
      };

      var buildChunk = function buildChunk(id, max, dataAb) {
        var idAb = strToAb(id);
        var maxAb = strToAb(max);

        return concatAbs([idAb, maxAb, dataAb]);
      };

      var chunkEnd = chunkSize;
      var chunkId = 0;

      for (var i = 0; i < dataSize; i += chunkSize) {
        var chunkAb = void 0;
        if (i < dataSize) {
          chunkAb = new Uint8Array(dataAb.slice(i, chunkEnd));
        } else {
          chunkAb = new Uint8Array(dataAb.slice(i));
        }
        chunkEnd += chunkSize;

        var id = applyPadding(chunkId, s.chunkId);
        var count = applyPadding(chunkCount, s.chunkCount);
        var chunk = buildChunk(id, count, chunkAb);

        this._sendToPeer(peer, this.message.types.chunk, hash, chunk);
        chunkId += 1;
      }
      this.log('sent chunked data for %s', hash);
    }
  }, {
    key: '_concatMessage',
    value: function _concatMessage(chunks) {
      this.log('concat message');

      chunks.sort(function (a, b) {
        if (a.id < b.id) {
          return -1;
        }
        if (a.id > b.id) {
          return 1;
        }
        return 0;
      });

      return concatAbs(chunks.map(function (c) {
        return c.data;
      }));
    }
  }, {
    key: '_onDataChannelCreated',
    value: function _onDataChannelCreated(channel) {
      var _this4 = this;

      this.log('onDataChannelCreated: %o', channel);

      channel.binaryType = 'arraybuffer';

      channel.onopen = function () {
        _this4.log('data channel opened');
        _this4._checkCache();
      };

      channel.onclose = function () {
        _this4.log('data channel closed');
      };

      channel.onmessage = function (event) {
        var message = _this4._abToMessage(event.data);
        var types = _this4.message.types;

        _this4.log('decoded message %o', message);

        // adapt for deletes
        switch (message.type) {
          case types.update:
            _this4._handleUpdate(message);
            break;
          case types.addedResource:
          case types.removedResource:
            _this4._handleUpdate(message, message.type);
            break;
          case types.request:
            _this4._handleRequest(message);
            break;
          case types.chunk:
            _this4._handleChunk(message);
            break;
          case types.response:
            _this4._handleAnswer(message);
            break;
        }
      };
    }
  }, {
    key: 'connectTo',
    value: function connectTo(peerID) {
      var _this5 = this;

      var isInitiator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      this.log('creating connection as initiator? %s', isInitiator);

      var peer = {
        id: peerID,
        con: new RTCPeerConnection(this.stunServer),
        dataChannel: null,
        resources: [],
        requestQueue: []
      };

      this.peers.push(peer);

      peer.con.onicecandidate = function (event) {
        _this5.log('icecandidate event: %o', event);

        if (event.candidate) {
          _this5.signaling.send(peer.id, {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
          });
        }
      };

      if (isInitiator) {
        this.log('creating data channel');

        peer.dataChannel = peer.con.createDataChannel('data');
        this._onDataChannelCreated(peer.dataChannel);

        this.log('creating an offer');

        peer.con.createOffer().then(function (desc) {
          _this5._onLocalSessionCreated(peer.id, desc);
        });
      } else {
        peer.con.ondatachannel = function (event) {
          _this5.log('ondatachannel: %o', event.channel);

          peer.dataChannel = event.channel;
          _this5._onDataChannelCreated(peer.dataChannel);
        };
      }
    }
  }, {
    key: 'receiveSignalMessage',
    value: function receiveSignalMessage(peerId, message) {
      var _this6 = this;

      var peer = this._getPeer(peerId);

      if (!peer) {
        this.connectTo(peerId, false);
        peer = this._getPeer(peerId);
      }

      if (message.type === 'offer') {
        this.log('Got offer %o. Sending answer to peer.', message);
        peer.con.setRemoteDescription(message).then(function () {
          peer.con.createAnswer().then(function (desc) {
            _this6._onLocalSessionCreated(peer.id, desc);
          });
        });
      } else if (message.type === 'answer') {
        this.log('Got answer. %o', message);
        peer.con.setRemoteDescription(message);
      } else if (message.type === 'candidate') {
        peer.con.addIceCandidate(message).then(function () {
          _this6.log('Set addIceCandidate successfully %o', message);
        }).catch(function (e) {
          return _this6.log('error: %o', e);
        });
      }
    }
  }, {
    key: 'removePeer',
    value: function removePeer(peerId) {
      var idx = this._getPeerIdx(peerId);

      if (idx >= 0) {
        this.log('remove peer %s', peerId);
        this.peers[idx].con.close();
        this.peers.splice(idx, 1);

        var i = 0;
        while (i < this.requests.length) {
          var req = this.requests[i];

          if (req.from === peerId) {
            this.log('remove pending request from %s', peerId);
            this.requests.splice(i, 1);
          } else {
            i += 1;
          }
        }
      }
    }

    // TODO adapt for deletes

  }, {
    key: 'updatePeers',
    value: function updatePeers(hash, msgType) {
      var _this7 = this;

      if (this.peers.length > 0) {
        this.log('broadcast peers for %s', hash);
        this.peers.forEach(function (peer) {
          _this7._sendToPeer(peer, msgType, hash);
        });
      }
    }
  }, {
    key: 'requestResourceFromPeers',
    value: function requestResourceFromPeers(hash, cb) {
      this.log('try to find a peer for %s', hash);
      var peers = this.peers.filter(function (p) {
        return p.resources.indexOf(hash) >= 0;
      });
      var count = peers.length;

      this.log('found %d peers', count);

      if (count > 0) {
        var randomPeerId = Math.floor(Math.random() * count);
        var peer = peers[randomPeerId];

        this._requestPeer(peer, this.message.types.request, hash, cb);
      } else {
        cb(undefined);
      }
    }
  }]);

  return Peer;
}();