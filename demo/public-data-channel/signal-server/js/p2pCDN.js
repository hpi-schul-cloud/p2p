var P2PCDN = function(){
  var webrtcConnection = new WebRTCConnection();
  var getRequestFromServiceWorker;
  var getRequestFromPeer;

  function sendMessageToServiceWorker(msg){
    return new Promise(function(resolve, reject){
      // Create a Message Channel
      var msg_chan = new MessageChannel();

      // Handler for recieving message reply from service worker
      msg_chan.port1.onmessage = function(event){
        if(event.data.error){
          reject(event.data.error);
        }else{
          resolve(event.data);
        }
      };

      // Send message to service worker along with port for reply
      navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    });
  }

  this.getRequest = function(url) {
    // TODO: sync
    return sendMessageToServiceWorker(url);
  }
  var init = function() {
    initServiceWorker();
  }

  var initServiceWorker = function() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('worker.js').then(function(registration) {
          // Registration was successful
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
          // registration failed :(
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
    initServiceWorkerListeners();
  }
  var initServiceWorkerListeners = function() {
    navigator.serviceWorker.addEventListener('message', async function(event){
      console.log(event.data);
      var response = await sendMessageToServiceWorker(event.data);
      event.ports[0].postMessage(response)
    });
  }

  init();
}

p2pCDN = new P2PCDN();
