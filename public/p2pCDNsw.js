"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idbKeyval = function (e) {
  "use strict";

  var t = function () {
    function t() {
      var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "keyval-store";

      var _t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "keyval";

      _classCallCheck(this, t);

      this.storeName = _t, this._dbp = new Promise(function (r, n) {
        var o = indexedDB.open(e, 1);o.onerror = function () {
          return n(o.error);
        }, o.onsuccess = function () {
          return r(o.result);
        }, o.onupgradeneeded = function () {
          o.result.createObjectStore(_t);
        };
      });
    }

    _createClass(t, [{
      key: "_withIDBStore",
      value: function _withIDBStore(e, t) {
        var _this = this;

        return this._dbp.then(function (r) {
          return new Promise(function (n, o) {
            var s = r.transaction(_this.storeName, e);s.oncomplete = function () {
              return n();
            }, s.onabort = s.onerror = function () {
              return o(s.error);
            }, t(s.objectStore(_this.storeName));
          });
        });
      }
    }]);

    return t;
  }();

  var r = void 0;function n() {
    return r || (r = new t()), r;
  }return e.Store = t, e.get = function (e) {
    var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : n();
    var r = void 0;return t._withIDBStore("readonly", function (t) {
      r = t.get(e);
    }).then(function () {
      return r.result;
    });
  }, e.set = function (e, t) {
    var r = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : n();
    return r._withIDBStore("readwrite", function (r) {
      r.put(t, e);
    });
  }, e.del = function (e) {
    var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : n();
    return t._withIDBStore("readwrite", function (t) {
      t.delete(e);
    });
  }, e.clear = function () {
    var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : n();
    return e._withIDBStore("readwrite", function (e) {
      e.clear();
    });
  }, e.keys = function () {
    var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : n();
    var t = [];return e._withIDBStore("readonly", function (e) {
      (e.openKeyCursor || e.openCursor).call(e).onsuccess = function () {
        this.result && (t.push(this.result.key), this.result.continue());
      };
    }).then(function () {
      return t;
    });
  }, e;
}({});
const CACHE_NAME = 'P2P-CDN-v1';
const version = '1.2.3';
var config = {}
var urlsToShare = "";
var excludedUrls;
var hasClientConnection = false;
var requests = [];
var serverSendTimeout;
var sendStatisticDelay = 10000;

self.addEventListener('install', function(event) {
  log("installing");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  log("activating");
  // hasClientConnection = false;
  event.waitUntil(self.skipWaiting());
  setConfig();
  self.clients.claim(); // Become available to all pages
});

function log(message) {
  if(config && config.verbose && typeof(console) !== 'undefined'){
    console.log("Service Worker: %s", message)
  }
}

function setConfig(){
  idbKeyval.get('swConfig').then(function(wsConfig){
    config = wsConfig.serviceWorker;
    config.clientId = wsConfig.clientId

    if(typeof(config) !== 'undefined'){
      if(typeof(config.urlsToShare) !== 'undefined') {
        urlsToShare = config.urlsToShare.join('|');
      }
      if(typeof(config.excludedUrls) !== 'undefined') {
        excludedUrls = config.excludedUrls.join('|');
      }
    }
  }).catch(function(error) {
    console.log(error);
  });;
}

function isClientReady(client){
  return new Promise(async function(resolve, reject) {
    const msg_chan = new MessageChannel();
    const timeout = 200;
    const msg = { type: 'heartbeat' }
    var receivedResponse = false;

    msg_chan.port1.onmessage = function(event) {
      receivedResponse = true;
      resolve(true);
    };

    // Send message to service worker along with port for reply
    setTimeout(function() {
      if (!receivedResponse) {
        msg_chan.port1.close();
        msg_chan.port2.close();
        log("client not ready")
        resolve(false)
      }
    }, timeout);

    client.postMessage(msg, [msg_chan.port2]);
  })
}

function sendMessageToClient(msg, clientID) {
  return new Promise(async function(resolve, reject) {
    const client = await clients.get(clientID);
    var timeout = 3000;
    if(typeof (config.fetchTimeout) !== 'undefined') {
      timeout = Number(config.fetchTimeout);
    }

    const clientReady = await isClientReady(client);
    if (typeof client === 'undefined' || !clientReady){
      resolve(false);
      return false;
    }

    const msg_chan = new MessageChannel();

    var receivedResponse = false;

    // Handler for receiving message reply from service worker
    msg_chan.port1.onmessage = function(event) {
      receivedResponse = true;
      resolve(event);
    };

    // Send message to service worker along with port for reply
    setTimeout(function() {
      if (!receivedResponse) {
        msg_chan.port1.close();
        msg_chan.port2.close();
        log('close message channel');
        resolve(false);
      }
    }, timeout);

    client.postMessage(msg, [msg_chan.port2]);
  });
}

function getCacheKeys() {
  const result = [];

  return caches.open(version).then(cache => {
    return cache.keys().then(keys => {
      keys.forEach(key => {
        var url = key.url;
        result.push(url.substr(url.lastIndexOf('/') + 1));
      });

      return result;
    });
  });
}

function getFromCache(key) {
  return caches.open(version).then(cache => {
    return cache.match(key).then(response => {
      return response;
    });
  });
}

async function getFromClient(clientId, hash) {
  log('Try to get resource from client: ' + hash);
  const msg = {type: 'request', hash};
  const message = await sendMessageToClient(msg, clientId);
  if (message.error) {
    log(message.error);
    return undefined;
  }
  if (message.data && message.data.data.length === 0) {
    log('Received empty message from client');
    return undefined;
  }
  if (message.data && message.data.data)
    return {
      'peerId': message.data.peerId,
      'from': message.data.from,
      'response': new Response(message.data.data)
    };

  return undefined;
}

function getFromInternet(url) {
  return fetch(url).then(response => {
    return response;
  });
}

// the request size is currently just an estimate for the needed size in the cache
async function getRequestSize(request){
  const obj = request.clone();
  const buffer = await obj.arrayBuffer()
  var view = new DataView(buffer);
  const offset = 3000;
  var requestSize = view.byteLength;
  var it = request.headers.entries();
  var header = it.next();
  var size = 0;
  while(!header.done){
    size += header.value[0].length;
    size += header.value[1].length;

    header = it.next();
  }
  requestSize += size
  requestSize += offset;

  // In case something goes wrong it is better to estimate the size with 0 than NaN,
  // to prevent the cache to be completely emptied
  if(isNaN(requestSize)){
    requestSize = 0;
  }

  return requestSize;
}

// removes the oldest request from the cache
// TODO: evtl so ändern das speicher bis zu einem bestimmten wert geschaffen wird --> performance
async function freeStorage(clientId){
  return new Promise(resolve =>{

    log("starting to free storage");
    caches.open(version).then(cache => {
      cache.keys().then(keys => {
        if(keys[0]){
          cache.delete(keys[0]).then( function() {
            resolve();
          });

          const urlArray = keys[0].url.split("/");
          const hash = urlArray[urlArray.length-1];
          notifyPeersAboutRemove(hash, clientId)
          log("Removed " + hash + "from the cache")
        } else{
          resolve();
        }
      });
    });
  })
}

async function putIntoCache(key, response, clientId, iteration) {
  iteration = iteration || 0;
  const maxIteration = 100;
  const obj = response.clone();
  var storage = await navigator.storage.estimate();
  const usedStorage = storage.usage;

  // make space for 10 requests of the same size
  var futureUsage = await getRequestSize(obj) * 10;
  futureUsage += usedStorage;

  if(!config.storageQuota ||
    (parseInt(config.storageQuota)*1000000 >= futureUsage &&
    storage.quota >= futureUsage)) {

    await caches.open(version).then(cache => {
      return cache.put(key, obj);
    });
  } else {
    if(iteration <= maxIteration){
      await freeStorage(clientId);
      putIntoCache(key, obj, clientId, iteration+1);
    }
  }
}

function logStatistic(url, method, request, timing, from, peerId) {
  if(!config.statisticPath) return;
  var p_Id = peerId ? peerId : config.clientId
  var data = {
    'peerId': p_Id,
    'method': method,
    'from': from,
    'url': url,
    'loadTime': timing,
    'currentTime': Date.now()
  }
  requests.push(data)
  sendStatisticToServer();
}

function sendStatisticToServer() {
  if(!serverSendTimeout && config.statisticPath){
    serverSendTimeout = setTimeout(function(){
      try {
        fetch(config.statisticPath, {
          method: 'POST',
          body: JSON.stringify(requests),
          headers:{
            'Content-Type': 'application/json'
          }
        });
      } catch(e) {

      } finally {
        serverSendTimeout = 0;
        requests = [];
      }
    }, sendStatisticDelay)
  }
}

function handleRequest(url, clientId) {
  return new Promise((resolve) => {
    var startTime = performance.now();

    sha256(url).then(hash => {

      // check cache
      getFromCache(hash).then(cacheResponse => {
        if (cacheResponse && config.cachingEnabled) {
          log('cacheResponse ' + cacheResponse.url);

          // This notify should not be needed
          notifyPeersAboutAdd(hash, clientId);
          var endTime = performance.now();
          logStatistic(url, 'cacheResponse', cacheResponse, endTime-startTime, 'cache');
          resolve(cacheResponse);
          return;
        }
        // check peers
        getFromClient(clientId, hash).then(data => {
          if (data && data.response) {
            var peerResponse = data.response;
            log('peerResponse ' + peerResponse.url);
            putIntoCache(hash, peerResponse, clientId).then(function () {
              notifyPeersAboutAdd(hash, clientId);
            });
            var endTime = performance.now();
            logStatistic(
              url,
              'peerResponse',
              peerResponse,
              endTime-startTime,
              data.from,
              data.peerId
            );
            resolve(peerResponse);
            return;
          }
          // get from the internet
          getFromInternet(url).then(response => {
            log('serverResponse ' + response.url);
            putIntoCache(hash, response, clientId).then(function () {
              notifyPeersAboutAdd(hash, clientId);
            });
            var endTime = performance.now();
            logStatistic(url, 'serverResponse', response, endTime-startTime, 'server');
            resolve(response);
          });
        });
      });
    });
  });
}

self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(event.request.url);

  if (urlsToShare === "") {
    setConfig();
    return;
  }

  if (request.method !== 'GET') return;

  if (!new RegExp(urlsToShare, 'gi').test(url.href)) return;
  if (excludedUrls && new RegExp(excludedUrls, 'gi').test(url.href)) return;

  log('Sw handles request: ' + url.href);

  if (!event.clientId) return;

  event.respondWith(handleRequest(event.request.url, event.clientId));
});

self.addEventListener('message', function(event) {
  try {
    const msg = event.data;
    if(typeof(event.ports[0]) === 'undefined') return undefined;
    if (msg.type === 'cache') {
      getCacheKeys().then(keys => {
        event.ports[0].postMessage(keys);
      });
    } else if (msg.type === 'resource') {
      getFromCache(msg.resource).then(cacheResponse => {
        if (typeof(cacheResponse) === 'undefined') {
          event.ports[0].postMessage({ 'error': 'Resource not found' });
          return;
        }
        log('cached object ' + cacheResponse);
        cacheResponse.arrayBuffer().then(buffer => {
          log('got buffer ' + buffer);
          event.ports[0].postMessage(buffer, [buffer]);
        });
      });
    } else if (msg.type === 'status' && msg.msg === 'ready') {
      setConfig();
      hasClientConnection = true;
    }
  } catch (e) {
    log(e);
    if (typeof event.ports[0] !== 'undefined') {
      event.ports[0].postMessage({ 'error': e} );
    }
  }
});

'use strict';

function getLogger(scope) {
  if (typeof debug !== 'undefined') {
    return debug(scope);
  }
  return function () {};
}

function toHex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);

  for (var i = 0; i < view.byteLength; i += 4) {
    var value = view.getUint32(i);
    var stringValue = value.toString(16);
    var padding = '00000000';
    var paddedValue = (padding + stringValue).slice(-padding.length);

    hexCodes.push(paddedValue);
  }
  // Join all the hex strings into one
  return hexCodes.join('');
}

function sha256(str) {
  var buffer = new TextEncoder('utf-8').encode(str);

  return crypto.subtle.digest('SHA-256', buffer).then(function (hash) {
    return toHex(hash);
  });
}

function abToStr(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function strToAb(input) {
  var str = input;
  if (typeof input === 'number') str = input.toString();

  var buf = new ArrayBuffer(str.length); // 1 bytes for each char
  var bufView = new Uint8Array(buf);

  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }

  return buf;
}

function concatAbs(abs) {
  var byteLength = 0;
  var length = 0;

  abs.forEach(function (ab) {
    byteLength += ab.byteLength;
  });

  var result = new Uint8Array(byteLength);

  abs.forEach(function (ab) {
    result.set(new Uint8Array(ab), length);
    length += ab.byteLength;
  });

  return result;
}

async function notifyPeers(hash, clientID, type) {
  var msg = {type: type, hash};
  var client = await clients.get(clientID);

  if(!client) return;

  client.postMessage(msg);
}

async function notifyPeersAboutAdd(hash, clientID) {
  notifyPeers(hash, clientID, 'addedResource');
}

async function notifyPeersAboutRemove(hash, clientID) {
  notifyPeers(hash, clientID, 'removedResource');
}
