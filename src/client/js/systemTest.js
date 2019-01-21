class SystemTest {

  constructor(config) {
    this.tests = {
      'clientConnection': false,
      'connectionBandwidth': false
    };
    this.maxWaitTime = 3000;
    this._initListeners();
  }

  testBrowser() {
    for(let feature in Modernizr){
      if(Modernizr.hasOwnProperty(feature)){
        if(!feature){
          return false;
        }
      }
    }
    return true;
  }

  clientConnection() {
    return new Promise(function(resolve, reject) {
      if(this.tests.clientConnection){
        return resolve(true);;
      }
      setTimeout(function(){
        resolve(this.tests.clientConnection);
      }.bind(this), this.maxWaitTime);
    }.bind(this));
  }

  connectionBandwidth() {

  }

  _initListeners() {
    document.addEventListener('sw:clientReady', function (event) {
      this.tests.clientConnection = true;
    }.bind(this));
  }
}
