const CACHE_NAME = 'P2P-CDN-v1';
const version = '1.2.3';
var config = {}
var urlsToShare = "";
var excludedUrls;
let hasClientConnection = false;

self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting());
});

function log(message) {
  if(this.config.verbose){
    console.log(message)
  }
}

function setConfig(){
  idbKeyval.get('swConfig').then(function(wsConfig){
    config = wsConfig;

    if(typeof(config) !== 'undefined'){
      if(typeof(config.urlsToShare) !== 'undefined') {
        urlsToShare = config.urlsToShare.join('|');
      }
      if(typeof(config.excludedUrls) !== 'undefined') {
        excludedUrls = config.excludedUrls.join('|');
      }
    }
  });
}

self.addEventListener('activate', function(event) {
  // hasClientConnection = false;
  event.waitUntil(self.skipWaiting());
  self.clients.claim(); // Become available to all pages
});

function isClientReady(client){
  return new Promise(async function(resolve, reject) {
    const msg_chan = new MessageChannel();
    const timeout = 200;
    const msg = { type: 'heartbeat' }
    let receivedResponse = false;

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
    const clientReady = await isClientReady(client);
    if (typeof client === 'undefined' || !clientReady){
      resolve(false);
      return false;
    }

    const msg_chan = new MessageChannel();
    const timeout = 2000;
    let receivedResponse = false;

    // Handler for receiving message reply from service worker
    msg_chan.port1.onmessage = function(event) {
      receivedResponse = true;
      log('received message from client ', event.data);
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
        let url = key.url;
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
  log('ask client to get: ', hash);
  // if(!hasClientConnection){
  //   console.log("client is not ready");
  //   return undefined;
  // }
  const msg = {type: 'request', hash};
  const message = await sendMessageToClient(msg, clientId);

  if (message.data)
    return new Response(message.data);

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
          log("Removed " + keys[0] + "from the cache")
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
  var futureUsage = await getRequestSize(obj);
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

function handleRequest(url, clientId) {
  return new Promise((resolve) => {
    sha256(url).then(hash => {
      // check cache
      getFromCache(hash).then(cacheResponse => {
        if (cacheResponse && config.cachingEnabled) {
          log('cacheResponse ', cacheResponse);

          // This notify should not be needed
          notifyPeersAboutAdd(hash, clientId);
          resolve(cacheResponse);
          return;
        }
        // check peers
        getFromClient(clientId, hash).then(peerResponse => {
          if (peerResponse) {
            log('peerResponse ', peerResponse);
            putIntoCache(hash, peerResponse, clientId);
            notifyPeersAboutAdd(hash, clientId);
            resolve(peerResponse);
            return;
          }
          // get from the internet
          getFromInternet(url).then(response => {
            log('internet response ', response);
            putIntoCache(hash, response, clientId);
            notifyPeersAboutAdd(hash, clientId);
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

  log('received request: ' + url);

  if (urlsToShare === "") {
    setConfig();
    return;
  }

  if (!new RegExp(urlsToShare, 'gi').test(url.href)) return;
  if (excludedUrls && new RegExp(excludedUrls, 'gi').test(url.href)) return;

  log('sw handles request: ' + url);

  if (!event.clientId) return;

  log('fetch --> ', event.request.url);

  event.respondWith(handleRequest(event.request.url, event.clientId));
});

self.addEventListener('message', function(event) {
  const msg = event.data;

  if (msg.type === 'cache') {
    getCacheKeys().then(keys => {
      event.ports[0].postMessage(keys);
    });
  } else if (msg.type === 'resource') {
    getFromCache(msg.resource).then(cacheResponse => {
      log('cached object ', cacheResponse);
      cacheResponse.arrayBuffer().then(buffer => {
        log('got buffer ', buffer);
        event.ports[0].postMessage(buffer, [buffer]);
      });
    });
  } else if (msg.type === 'status' && msg.msg === 'ready') {
    setConfig();
    hasClientConnection = true;
  }
});
