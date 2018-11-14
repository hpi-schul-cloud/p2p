class ServiceWorkerMiddleware {

  constructor(config) {
    this.log = debug('openhpi:ServiceWorkerMiddleware');
    this.log('setup');
    this._initServiceWorker(config.serviceWorker);
  }

  _initServiceWorker(swConfig) {
    const sw = navigator.serviceWorker || {};

    if(typeof(sw) === 'undefined' || typeof(idbKeyval) === 'undefined'){
      return false;
    }

    idbKeyval.set('swConfig', swConfig).then(() => {
      window.addEventListener('load', () => {
        if (sw.controller) {
          this.log('serviceWorker already registered');
        } else {
          sw.register(swConfig.path, {scope: swConfig.scope}).then(registration => {
            this.log('registration successful, scope: %s', registration.scope);
          }, err => {
            this.log('registration failed: %s', err);
          });
        }
      });
    });
    this._initListeners();
  }

  _onRequest(hash, cb) {
    const msg = {hash: hash, cb: cb};

    document.dispatchEvent(
        new CustomEvent('peer:onRequestResource', {detail: msg})
    );
  }

  _onUpdate(hash) {
    document.dispatchEvent(
        new CustomEvent('peer:onUpdatePeers', {detail: hash})
    );
  }

  _onServiceWorkerMessage(event) {
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
  }

  _onClientReady() {
    const msg = { type: 'status', msg: 'ready' };
    this.messageToServiceWorker(msg);
  }

  _onRequestCache(event) {
    const msg = { type: "cache" };
    this.messageToServiceWorker(msg).then(cachedResources => {
      event.detail(cachedResources);
    });
  }

  _onRequestResource(event) {
    const msg = { type: "resource", resource: event.detail.hash };

    this.messageToServiceWorker(msg).then(resource => {
      event.detail.cb(resource);
    });
  }

  _initListeners() {
    navigator.serviceWorker.addEventListener('message', this._onServiceWorkerMessage.bind(this));

    document.addEventListener('sw:clientReady', this._onClientReady.bind(this));

    document.addEventListener('sw:onRequestCache', this._onRequestCache.bind(this));

    document.addEventListener('sw:onRequestResource', this._onRequestResource.bind(this));
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
