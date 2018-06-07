'use strict';

var WebRTCConnection = function(){

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

  function signalingMessageCallback(message) {
    if (message.type === 'offer') {
      // console.log('Got offer. Sending answer to peer.');
      peerConn.setRemoteDescription(message).then(() => {
        peerConn.createAnswer().then(onLocalSessionCreated);
      });

    } else if (message.type === 'answer') {
      // console.log('Got answer.');
      peerConn.setRemoteDescription(message);

    } else if (message.type === 'candidate') {
      peerConn.addIceCandidate(message).then(() => {
        // console.log('Set addIceCandidate successfully');
      }).catch(e => console.log(e));

    }
  }

  function createPeerConnection(isInitiator, config) {
    // console.log('Creating Peer con as initiator?', isInitiator, 'config:',config);
    peerConn = new RTCPeerConnection(config);

    // send any ice candidates to the other peer
    peerConn.onicecandidate = event => {
      // console.log('icecandidate event:', event);
      if (event.candidate) {
        sendMessage({
              type: 'candidate',
              label: event.candidate.sdpMLineIndex,
              id: event.candidate.sdpMid,
              candidate: event.candidate.candidate,
            },
        );
      } else {
        // console.log('End of candidates.');
      }
    };

    if (isInitiator) {
      // console.log('Creating Data Channel');
      dataChannel = peerConn.createDataChannel('test');
      onDataChannelCreated(dataChannel);

      // console.log('Creating an offer');
      peerConn.createOffer().then(onLocalSessionCreated);
    } else {
      peerConn.ondatachannel = function(event) {
        // console.log('ondatachannel:', event.channel);
        dataChannel = event.channel;

        onDataChannelCreated(dataChannel);
      };
    }
  }

  function onLocalSessionCreated(desc) {
    // console.log('local session created:', desc);
    peerConn.setLocalDescription(desc).then(() => {
      // console.log('sending local desc:', peerConn.localDescription);
      sendMessage(peerConn.localDescription);
    });
  }

  function onDataChannelCreated(channel) {
    console.log('onDataChannelCreated:', channel);

    channel.binaryType = "arraybuffer";

    channel.onopen = () => {
      console.log('CHANNEL opened!!!');
    };

    channel.onclose = () => {
      console.log('Channel closed.');
    };

    channel.onmessage = event => {
      console.log('WebRTC: received message ', event.data);
      console.log('WebRTC: client queue ', RESPONSE_QUEUE);

      const extractUrl = event.data && event.data.url || '';

      console.log('extracted url: ', extractUrl);

      const idx = RESPONSE_QUEUE.findIndex(res => res.url === extractUrl);

      // ATTENTION! HOTFIX, we need to map the data back to the request url
      if (RESPONSE_QUEUE.length > 0) {
        // response and pass it back
        console.log('WRTC-Client: received a response for ', RESPONSE_QUEUE[RESPONSE_QUEUE.length-1]);
        RESPONSE_QUEUE[RESPONSE_QUEUE.length-1].callBack(event.data);

        RESPONSE_QUEUE.pop()
      } else {
        // ask own service worker
        console.log('WRTC-Client: ask my service worker for resource');

        sendSyncedMessage(event.data).then(data => {

          console.log('WRTC-Client: received the requested resource', data);

          dataChannel.send(data);
        });
      }
    };
  }


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
    return new Promise(function(resolve, reject){
      // Create a Message Channel
      var msg_chan = new MessageChannel();

      // Handler for recieving message reply from service worker
      msg_chan.port1.onmessage = function(event){
        console.log("YEAH ", event.data);
        resolve(event.data);
      };

      console.log('WebRTC: ask my service worker for: ', msg);

      // Send message to service worker along with port for reply
      navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    });
  }

  this.getRequestFromPeer = function(url) {
    return sendSyncedMessage(url).then(function(response) {
      console.log("AND THE ANSWER IS:")
      console.log(response.data);
    });

  }
}
