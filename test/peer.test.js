describe('Peer', function() {
  beforeEach(function() {;
    const CHANNEL = 'FIXED_CLASS_1';
    const STUN_SERVER = {
      'iceServers': [
        {
          'urls': 'stun:stun.l.google.com:19302',
        },
      ],
    };
    var peer = new Peer(CHANNEL, STUN_SERVER);
  })
})
