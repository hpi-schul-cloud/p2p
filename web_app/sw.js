const CACHE_NAME = 'my-site-cache-v1';
const version = '1.2.3';
const urlsToCache = [
  '/img/fab.gif',
  '/img/logo.jpg',
];

self.importScripts('/js/utils.js');

self.addEventListener('install', function(event) {
  // Perform install steps
  // event.waitUntil(
  //   caches.open(CACHE_NAME)
  //     .then(function(cache) {
  //       console.log('Opened cache');
  //       return cache.addAll(urlsToCache);
  //     })
  // );
  event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim()); // Become available to all pages
});

function sendMessageToClient(msg, clientID) {
  return new Promise(async function(resolve, reject) {
    // Create a Message Channel
    const client = await clients.get(clientID);
    const msg_chan = new MessageChannel();

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
          resolve(sendMessageToClient(msg, clientID));
        }
      }, 2000);

      client.postMessage(msg, [msg_chan.port2]);
    }
  });
}

function getCacheValue(key) {
  return caches.open(version).then(cache => {
    return cache.match(key).then(response => {

      const fetchPromise = fetch(key).then(networkResponse => {
        cache.put(key, networkResponse.clone());
        return networkResponse;
      });

      // Return the response from cache or wait for network.
      return response || fetchPromise;
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

  const message = await sendMessageToClient(hash, clientId);

  if (message.data)
    return new Response(message.data);
  return undefined;
}

function getFromInternet(url) {
  return fetch(url);
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

function handelRequest(url, clientId) {
  return new Promise((resolve) => {
    sha256(url).then(hash => {
      // check cache
      getFromCache(hash).then(cacheResponse => {
        console.log('cacheResponse ', cacheResponse);
        if (cacheResponse) {
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

  console.log('try to fetch --> ', event.request.url);

  if (!urlsToCache.includes(url.pathname)) return;
  if (!event.clientId) return;
  if (url.origin !== location.origin) return;

  console.log('fetch --> ', event.request.url);

  event.respondWith(handelRequest(event.request.url, event.clientId));
});

self.addEventListener('message', function(event) {
  const hash = event.data;

  console.log('received request for ', hash);
  getFromCache(hash).then(cacheResponse => {
    console.log('cached object ', cacheResponse);
    cacheResponse.arrayBuffer().then(buffer => {
      console.log('got buffer ', buffer);
      event.ports[0].postMessage(buffer, [buffer]);
    });
  });
  // const response = await getCacheValue(event.data);
  // const buffer = await response.arrayBuffer();
  //
  // event.ports[0].postMessage(buffer, [buffer]);
});
