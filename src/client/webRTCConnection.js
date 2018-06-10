class WebRTC {

  constructor(signalFunction, stunServer) {
    this.log = debug('openhpi:webRTC');

    this.signal = signalFunction;
    this.stunServer = stunServer;
    this.peers = [];
  }

  _peerExists(peerId) {
    return this.peers.map(p => p.id).indexOf(peerId) >= 0;
  }

  _getPeer(peerId) {
    const idx = this.peers.map(p => p.id).indexOf(peerId);

    if(idx >= 0)
      return this.peers[idx]
    return {};
  }

  _onLocalSessionCreated(peerId, desc) {
    this.log('local session created: %o', desc);

    const peer = this._getPeer(peerId);

    peer.con.setLocalDescription(desc).then(() => {
      this.log('sending local desc: %o', peer.con.localDescription);
      this.signal(peer.id, peer.con.localDescription);
    });
  }

  _onDataChannelCreated(channel) {
    this.log('onDataChannelCreated: %o', channel);

    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      this.log('channel opened');
    };

    channel.onclose = () => {
      this.log('channel closed');
    };

    channel.onmessage = event => {
      this.log('received message: %o', event.data);
      // console.log('WebRTC: client queue ', RESPONSE_QUEUE);
      //
      // const extractUrl = event.data && event.data.url || '';
      //
      // console.log('extracted url: ', extractUrl);
      //
      // const idx = RESPONSE_QUEUE.findIndex(res => res.url === extractUrl);
      //
      // // ATTENTION! HOTFIX, we need to map the data back to the request url
      // if (RESPONSE_QUEUE.length > 0) {
      //   // response and pass it back
      //   console.log('WRTC-Client: received a response for ', RESPONSE_QUEUE[RESPONSE_QUEUE.length-1]);
      //   RESPONSE_QUEUE[RESPONSE_QUEUE.length-1].callBack(event.data);
      //
      //   RESPONSE_QUEUE.pop()
      // } else {
      //   // ask own service worker
      //   console.log('WRTC-Client: ask my service worker for resource');
      //
      //   sendSyncedMessage(event.data).then(data => {
      //
      //     console.log('WRTC-Client: received the requested resource', data);
      //
      //     dataChannel.send(data);
      //   });
      // }
    };
  }

  createPeerConnection(clientId, isInitiator) {
    this.log('creating connection as initiator? %s', isInitiator);

    const peer = {
      id: clientId,
      con: new RTCPeerConnection(this.stunServer),
      dataChannel: null,
    };

    this.peers.push(peer);

    peer.con.onicecandidate = event => {
      this.log('icecandidate event: %o', event);

      if (event.candidate) {
        this.signal(peer.id, {
              type: 'candidate',
              label: event.candidate.sdpMLineIndex,
              id: event.candidate.sdpMid,
              candidate: event.candidate.candidate,
            }
        );
      }
    };

    if (isInitiator) {
      this.log('creating data channel');

      peer.dataChannel = peer.con.createDataChannel('data');
      this._onDataChannelCreated(peer.dataChannel);

      this.log('creating an offer');

      peer.con.createOffer().then(desc => {
        this._onLocalSessionCreated(peer.id, desc);
      });
    } else {
      peer.con.ondatachannel = event => {
        this.log('ondatachannel: %o', event.channel);

        peer.dataChannel = event.channel;
        this._onDataChannelCreated(peer.dataChannel);
      };
    }
  }

  messageCallback(peerId, message) {
    const peerExists = this._peerExists(peerId);

    if (!peerExists) {
      this.createPeerConnection(peerId, false);
    }

    const peer = this._getPeer(peerId);

    if (message.type === 'offer') {
      this.log('Got offer. Sending answer to peer.');
      peer.con.setRemoteDescription(message).then(() => {
        peer.con.createAnswer().then(desc => {
          this._onLocalSessionCreated(peer.id, desc);
        });
      });

    } else if (message.type === 'answer') {
      this.log('Got answer.');
      peer.con.setRemoteDescription(message);

    } else if (message.type === 'candidate') {
      peer.con.addIceCandidate(message).then(() => {
        this.log('Set addIceCandidate successfully');
      }).catch(e => this.log('error: %o', e));

    }
  }

}

var WebRTCConnection = function() {

  const STUN_SERVER = {
    'iceServers': [
      {
        'urls': 'stun:stun.l.google.com:19302',
      },
    ],
  };

  /****************************************************************************
   * WebRTC peer connection and data channel
   ****************************************************************************/

  let peerConn;
  let dataChannel;

  /****************************************************************************
   * Interaction
   ****************************************************************************/

  // Joining a room.
  // TODO: why global???
  window.channel = 'dataChannel';
  socket.emit('create or join', channel);

  let sendQueue = [];

  this.sendDataMessage = function(message) {
    let sendData = message;

    switch (dataChannel.readyState) {
      case 'connecting':
        console.log('Connection not open; queueing: ' + sendData);
        sendQueue.push(sendData);
        break;
      case 'open':
        if (sendQueue.length === 0) {
          dataChannel.send(sendData);
        } else {
          sendQueue.forEach((msg) => dataChannel.send(msg));
        }
        break;
      case 'closing':
        console.log('Attempted to send message while closing: ' + msg);
        break;
      case 'closed':
        console.log('Error! Attempt to send while connection closed.');
        break;
    }
  };

  const RESPONSE_QUEUE = [];

  this.waitForResponse = function(url, cb) {
    const request = {};
    request.url = url;
    request.callBack = cb;

    RESPONSE_QUEUE.push(request);

    console.log('WebRTC: ask other peer');

    this.sendDataMessage(url);
  };

  var sendSyncedMessage = function(msg) {
    return new Promise(function(resolve, reject) {
      // Create a Message Channel
      var msg_chan = new MessageChannel();

      // Handler for recieving message reply from service worker
      msg_chan.port1.onmessage = function(event) {
        console.log('YEAH ', event.data);
        resolve(event.data);
      };

      console.log('WebRTC: ask my service worker for: ', msg);

      // Send message to service worker along with port for reply
      navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    });
  };

  this.getRequestFromPeer = function(url) {
    return sendSyncedMessage(url).then(function(response) {
      console.log('AND THE ANSWER IS:');
      console.log(response.data);
    });

  };
};
