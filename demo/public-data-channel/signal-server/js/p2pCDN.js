var P2PCDN = function() {
  var getRequestFromServiceWorker;
  var getRequestFromPeer;
  let webrtcConnection = new WebRTCConnection();

  function sendMessageToServiceWorker(msg) {
    return new Promise(function(resolve, reject) {
      // Create a Message Channel
      var msg_chan = new MessageChannel();

      // Handler for receiving message reply from service worker
      msg_chan.port1.onmessage = function(event) {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };

      console.log('Client: ask service worker for resource');

      // Send message to service worker along with port for reply
      navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    });
  }

  this.getRequest = function(url) {
    return sendMessageToServiceWorker(url);
  };

  var init = function() {
    initServiceWorker();
  };

  var initServiceWorker = function() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        if (navigator.serviceWorker.controller) {
          console.log('ServiceWorker already registered');
        } else {
          navigator.serviceWorker.register('worker.js', {scope: '/'}).
              then(function(registration) {
                // Registration was successful
                console.log(
                    'ServiceWorker registration successful with scope: ',
                    registration.scope);
              }, function(err) {
                // registration failed :(
                console.log('ServiceWorker registration failed: ', err);
              });
        }
      });
      initServiceWorkerListeners();
    }
  };

  function askPeerForResource(url, callback) {
    webrtcConnection.waitForResponse(url, callback);
  }

  function initServiceWorkerListeners() {
    navigator.serviceWorker.addEventListener('message', async function(event) {
      console.log('Client: received request for: ', event.data);
      // const response = await sendMessageToServiceWorker(event.data);
      const reply = (response) => {
        console.log('Client: has received something: ', response);
        event.ports[0].postMessage(response);
      };

      const response = askPeerForResource(event.data, reply);

    });
  }

  init();
};

p2pCDN = new P2PCDN();
