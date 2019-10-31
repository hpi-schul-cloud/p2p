class P2pCDN {
  constructor(config) {
    if(!config.clientId) return;
    this.systemTest = new SystemTest(this);

    if(!this.systemTest.testBrowser()) return;

    const idLength = config.idLength;
    if(config.logLevel === 'all') {
      localStorage.debug = '*';
    } else {
      localStorage.debug = '*,-*:detail'
    }

    // Fixed id size is needed for binary data transmission via datachannels
    const adjustCount = idLength-config.clientId.toString().length;
    if(adjustCount < 0) {
      config.clientId = config.clientId.slice(0, idLength);
    } else {
      config.clientId = "0".repeat(adjustCount) + config.clientId;
    }


    this.peer = new Peer(config);
  }

  systemTest() {
    return this.systemTest;
  }
}
module.exports = P2pCDN;
