var CACHE_NAME = 'my-site-cache-v1';
const version = "1.2.3";

var urlsToCache = [
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
});

function send_message_to_client(msg, clientID){
    return new Promise(async function(resolve, reject){
        // Create a Message Channel
        const client = await clients.get(clientID);
        var msg_chan = new MessageChannel();

        // Handler for recieving message reply from service worker
        msg_chan.port1.onmessage = function(event){
          resolve(event);
        };

        // Send message to service worker along with port for reply
        if(typeof client !== 'undefined'){
          client.postMessage(msg, [msg_chan.port2]);
        }
    });
}

var getResponse = async function (event) {
  var request = event.request;
  await clients.get(event.clientId);
  var message = await send_message_to_client(event.request.url, event.clientId);
  return new Response(message.data);
}

var getCacheValue = function(key) {
  return caches.open(version).then(cache => {
    return cache.match(key).then(response => {
      var fetchPromise = fetch(key).then(networkResponse => {
        cache.put(key, networkResponse.clone());
        return networkResponse;
      });

      // Return the response from cache or wait for network.
      return response || fetchPromise;
    })
  });
}
self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(event.request.url)
  if (!urlsToCache.includes(url.pathname)) return;
  if (!event.clientId) return;
  if(url.origin !== location.origin) return;
  event.respondWith(getResponse(event));
});

self.addEventListener('message', async function(event){
    var response = await getCacheValue(event.data);
    //var blob = await response.blob()
    var buffer = await response.arrayBuffer();
    event.ports[0].postMessage(buffer, [buffer]);
});
