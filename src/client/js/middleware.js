class ServiceWorkerMiddleware {

  constructor() {
    this.log = debug('openhpi:ServiceWorkerMiddleware');
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

  _onRequest(hash, cb) {
    this.peer.requestResourceFromPeers(hash, cb);
    document.dispatchEvent(
      new CustomEvent('p2pCDN:onUpdate', {detail: this.peer.peers})
    );
  }

  _onUpdate(hash) {
    this.peer.updatePeers(hash);
    document.dispatchEvent(
      new CustomEvent('p2pCDN:onUpdate', {detail: this.peer.peers})
    );
  }

  _initListeners() {
    navigator.serviceWorker.addEventListener('message', function(event) {
      this.log('received request for: %o', event.data);

      if (event.data.type === 'update') {
        this._onUpdate(event.data.hash);
      } else if (event.data.type === 'request') {
        const reply = response => {
          this.log('have received something: %s', response);
          event.ports[0].postMessage(response);
        };
        this._onRequest(event.data.hash, reply);
      } else {
        this.log('cant match request!');
      }
    }.bind(this));

    document.addEventListener('p2pCDN:clientReady', function(event){
      const msg = { type: 'status', msg: 'ready' };
      this.messageToServiceWorker(msg)
    }.bind(this));

  }

  messageToServiceWorker(msg) {
    return new Promise((resolve, reject) => {
      if(!navigator.serviceWorker.controller){
        resolve(undefined);
        return;
      }
      const msg_chan = new MessageChannel();
      // Handler for receiving message reply from service worker
      msg_chan.port1.onmessage = event => {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };

      this.log('ask service worker for %o', msg);
      // Send message to service worker along with port for reply
      navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    });
  }

}
