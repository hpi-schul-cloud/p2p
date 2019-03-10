class P2pCDN {
  // TOdo apply to peer
  constructor(config) {
    const idLength = 24;

    // Fixed id size is needed for binary data transmission via datachannels
    config.clientId = "0".repeat(idLength-config.clientId.toString().length) + config.clientId

    this.systemTest = new SystemTest(this);
    this.peer = new Peer(config);
  }

  systemTest() {
    return this.systemTest;
  }
}
