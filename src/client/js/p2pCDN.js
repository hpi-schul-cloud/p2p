class p2pCDN {
  constructor(config) {
    this.systemTest = new SystemTest();
    this.systemTest.clientConnection().then(function(a) { console.log(a)})

    this.peer = new Peer(config);
  }

  systemTest() {
    return this.systemTest;
  }
}
