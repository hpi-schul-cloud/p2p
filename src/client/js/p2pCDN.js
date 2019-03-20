class P2pCDN {
  // TOdo apply to peer
  constructor(config) {
    const idLength = config.idLength;

    // Fixed id size is needed for binary data transmission via datachannels
    const adjustCount = idLength-config.clientId.toString().length;
    if(adjustCount < 0) {
      config.clientId = config.clientId.slice(0, idLength);
    } else {
      config.clientId = "0".repeat(adjustCount) + config.clientId;
    }

    this.systemTest = new SystemTest(this);
    this.peer = new Peer(config);
  }

  systemTest() {
    return this.systemTest;
  }
}
