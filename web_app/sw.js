const CACHE_NAME = 'my-site-cache-v1';
const version = '1.2.3';
const clientState = {};
const maxRetryCount = 300;
const cachingEnabled = false;
const urlsToCache = [
  '/img/',
  '/video/',
].join('|');

self.importScripts('/js/utils.js');

self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim()); // Become available to all pages
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForClient(client, tryCount) {
  if (maxRetryCount === tryCount) {
    return false;
  }
  if (clientState[client.id] === 'ready') {
    return true;
  }
  await sleep(200);
  console.log('wait for client');
  return waitForClient(client, tryCount + 1);
}

function sendMessageToClient(msg, clientID) {
  return new Promise(async function(resolve, reject) {
    const client = await clients.get(clientID);
    await waitForClient(client, 0);
    const msg_chan = new MessageChannel();
    const timeout = 20000;
    let receivedResponse = false;

    // Handler for receiving message reply from service worker
    msg_chan.port1.onmessage = function(event) {
      receivedResponse = true;
      console.log('received message from client ', event.data);
      resolve(event);
    };

    // Send message to service worker along with port for reply
    if (typeof client !== 'undefined') {
      setTimeout(function() {
        if (!receivedResponse) {
          msg_chan.port1.close();
          msg_chan.port2.close();
          console.log('close message channel');
          reject('Timeout of ' + timeout);
        }
      }, timeout);

      client.postMessage(msg, [msg_chan.port2]);
    }
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
  console.log('ask client to get: ', hash);
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

async function putIntoCache(key, response) {
  const obj = response.clone();

  await caches.open(version).then(cache => {
    return cache.put(key, obj);
  });
}

async function notifyPeers(hash, clientID) {
  const msg = {type: 'update', hash};
  const client = await clients.get(clientID);

  client.postMessage(msg);
}

function handleRequest(url, clientId) {
  return new Promise((resolve) => {
    sha256(url).then(hash => {
      // check cache
      getFromCache(hash).then(cacheResponse => {
        console.log('cacheResponse ', cacheResponse);
        if (cacheResponse && cachingEnabled) {
          notifyPeers(hash, clientId);
          resolve(cacheResponse);
        } else {
          // check peers
          getFromClient(clientId, hash).then(peerResponse => {
            console.log('peerResponse ', peerResponse);
            if (peerResponse) {
              putIntoCache(hash, peerResponse);
              notifyPeers(hash, clientId);
              resolve(peerResponse);
            } else {
              // get from the internet
              getFromInternet(url).then(response => {
                console.log('internet response ', response);
                putIntoCache(hash, response);
                notifyPeers(hash, clientId);
                resolve(response);
              });
            }
          });
        }
      });
    });
  });
}

self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(event.request.url);

  console.log('received request: ' + url);

  if (!new RegExp(urlsToCache, 'gi').test(url.pathname)) return;

  console.log('sw handles request: ' + url);

  if (!event.clientId) return;
  if (url.origin !== location.origin) return;

  console.log('fetch --> ', event.request.url);

  event.respondWith(handleRequest(event.request.url, event.clientId));
});

self.addEventListener('message', function(event) {
  const msg = event.data;

  if (msg.type === 'status') {
    clientState[event.source.id] = event.data.msg;
  } else if (msg.type === 'cache') {
    getCacheKeys().then(keys => {
      event.ports[0].postMessage(keys);
    });
  } else if (msg.type === 'resource') {
    getFromCache(msg.resource).then(cacheResponse => {
      console.log('cached object ', cacheResponse);
      cacheResponse.arrayBuffer().then(buffer => {
        console.log('got buffer ', buffer);
        event.ports[0].postMessage(buffer, [buffer]);
      });
    });
  }
});
