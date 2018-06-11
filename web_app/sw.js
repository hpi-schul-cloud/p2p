const CACHE_NAME = 'my-site-cache-v1';
const version = '1.2.3';

const urlsToCache = [
  '/img/fab.gif',
];

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

function getFromCache(url) {
  return caches.open(version).then(cache => {
    cache.match(url).then(response => {
      response;
    });
   });
}

async function getFromClient(event) {
  const request = event.request;
  await clients.get(event.clientId);

  console.log('ask client to get: ', event.request.url);

  const message = await sendMessageToClient(event.request.url, event.clientId);

  if(message.data)
    return new Response(message.data);
  return undefined;
}

function getFromInternet(url) {
  return fetch(url);
}

async function putIntoCache(url, response) {
  await caches.open(version).then(cache => {
    cache.put(url, response.clone());
  });
}

async function notifyPeers(cachedUrl, clientID){
  const msg = {type: 'resource', url: cachedUrl};
  const client = await clients.get(clientID);

  client.postMessage(msg);
}

function handelRequest(event) {
  // check cache
  getFromCache(event.request.url).then(cacheResponse => {
    console.log('cacheResponse ', cacheResponse);
    if(cacheResponse)
      event.respondWith(cacheResponse);

    // check peers
    getFromClient(event).then(peerResponse => {
      console.log('peerResponse ', peerResponse);
      if(peerResponse){
        putIntoCache(event.request.url, peerResponse);
        event.respondWith(peerResponse);
        notifyPeers(event.request.url, event.clientId);
      }

      // get from the internet
      getFromInternet(event.request.url).then(response => {
        console.log('response ', response);
        putIntoCache(event.request.url, response);
        notifyPeers(event.request.url, event.clientId);
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

  handelRequest(event);
});

self.addEventListener('message', async function(event) {
  const response = await getCacheValue(event.data);
  const buffer = await response.arrayBuffer();

  event.ports[0].postMessage(buffer, [buffer]);
});
