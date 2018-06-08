const CACHE_NAME = 'my-site-cache-v1';
const version = '1.2.3';

const urlsToCache = [
  '/img/logo.png',
];
//
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
  event.waitUntil(self.peers.claim()); // Become available to all pages
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

      console.log('SW: Received message from client', event.data);

      resolve(event);
    };

    // Send message to service worker along with port for reply
    if (typeof client !== 'undefined') {
      setTimeout(function() {
        if (!receivedResponse) {
          msg_chan.port1.close();
          msg_chan.port2.close();
          console.log('SW: close message channel');
          resolve(sendMessageToClient(msg, clientID));
        }
      }, 2000);
      client.postMessage(msg, [msg_chan.port2]);
    }
  });
}

const getResponse = async function(event) {
  const request = event.request;
  await clients.get(event.clientId);

  console.log('SW: ask client to get: ', event.request.url);

  const message = await sendMessageToClient(event.request.url, event.clientId);

  return new Response(message.data);
};

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

self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(event.request.url);

  if (!urlsToCache.includes(url.pathname)) return;
  if (!event.clientId) return;
  if (url.origin !== location.origin) return;

  console.log('SW: fetch -->', event.request.url);

  event.respondWith(getResponse(event));
});

self.addEventListener('message', async function(event) {
  const response = await getCacheValue(event.data);
  const buffer = await response.arrayBuffer();

  event.ports[0].postMessage(buffer, [buffer]);
});
