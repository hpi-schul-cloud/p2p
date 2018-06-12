class ClientServiceWorker {

  constructor() {
    this.log = debug('openhpi:ClientServiceWorker');
    this.log('setup');

    this.onRequest = null;
    this.onUpdate = null;
    this._initServiceWorker();
  }

  _initServiceWorker() {
    const sw = navigator.serviceWorker || {};

    if (sw) {
      window.addEventListener('load', () => {
        if (sw.controller) {
          this.log('serviceWorker already registered');
        } else {
          sw.register('sw.js', {scope: '/'}).then(registration => {
            this.log('registration successful, scope: %s', registration.scope);
          }, err => {
            this.log('registration failed: %s', err);
          });
        }
      });
      this._initListeners();
    }
  }

  _initListeners() {
    navigator.serviceWorker.addEventListener('message', function(event) {
      this.log('received request for: %o', event.data);

      if(event.data.type){
        this.onUpdate(event.data.hash);
      } else {

        const reply = response => {
          this.log('have received something: %s', response);
          event.ports[0].postMessage(response);
        };

        this.onRequest(event.data, reply);
      }
    }.bind(this));
  }

  messageToServiceWorker(msg) {
    return new Promise((resolve, reject) => {
      // Create a Message Channel
      const msg_chan = new MessageChannel();

      // Handler for receiving message reply from service worker
      msg_chan.port1.onmessage = function(event) {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };

      this.log('ask service worker for %s', msg);

      // Send message to service worker along with port for reply
      // todo: why port2?
      navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    });
  }

}