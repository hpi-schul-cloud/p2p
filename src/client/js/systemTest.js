class SystemTest {

  constructor(p2pCDN) {
    this.p2pCDN = p2pCDN;
    this.tests = {
      'webrtcInitialized': false
    };
    this.maxWaitTime = 3000;
    this._initListeners();
  }

  testBrowser() {
    for(let feature in Modernizr){
      if(Modernizr.hasOwnProperty(feature) && !feature){
        return false;
      }
    }
    return typeof navigator.serviceWorker !== 'undefined';
  }

  webrtcInitialized() {
    return this._executeWithRetry(function(){
      return this.tests.webrtcInitialized;
    }.bind(this));
  }

  clientConnected() {
    return this._executeWithRetry(function(){
      if(this.p2pCDN.peer.peers.length === 0){
        return false;
      }
      const peer = this.p2pCDN.peer.peers[0];
      return (this.p2pCDN.peer._getStateFor(peer) === 'open');
    }.bind(this));
  }

  _executeWithRetry(validator) {
    return new Promise(function(resolve, reject) {
      let result = validator();
      if(validator()){
        return resolve(true);
      }
      setTimeout(function(){
        resolve(validator());
      }, this.maxWaitTime);
    }.bind(this));
  }

  _initListeners() {
    document.addEventListener('sw:clientReady', function (event) {
      this.tests.webrtcInitialized = true;
    }.bind(this));
  }
}
