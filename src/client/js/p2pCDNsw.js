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
