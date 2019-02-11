class P2pCDN {
  constructor(config) {
    this.systemTest = new SystemTest(this);
    this.peer = new Peer(config);
  }

  systemTest() {
    return this.systemTest;
  }
}
