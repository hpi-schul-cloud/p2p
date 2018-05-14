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
      console.log('Got offer. Sending answer to peer.');
      peerConn.setRemoteDescription(message).then(() => {
        peerConn.createAnswer().then(onLocalSessionCreated);
      });

    } else if (message.type === 'answer') {
      console.log('Got answer.');
      peerConn.setRemoteDescription(message);

    } else if (message.type === 'candidate') {
      peerConn.addIceCandidate(message).then(() => {
        console.log('Set addIceCandidate successfully');
      }).catch(e => console.log(e));

    }
  }

  function createPeerConnection(isInitiator, config) {
    console.log('Creating Peer con as initiator?', isInitiator, 'config:',config);
    peerConn = new RTCPeerConnection(config);

    // send any ice candidates to the other peer
    peerConn.onicecandidate = event => {
      console.log('icecandidate event:', event);
      if (event.candidate) {
        sendMessage({
              type: 'candidate',
              label: event.candidate.sdpMLineIndex,
              id: event.candidate.sdpMid,
              candidate: event.candidate.candidate,
            },
        );
      } else {
        console.log('End of candidates.');
      }
    };

    if (isInitiator) {
      console.log('Creating Data Channel');
      dataChannel = peerConn.createDataChannel('test');
      onDataChannelCreated(dataChannel);

      console.log('Creating an offer');
      peerConn.createOffer().then(onLocalSessionCreated);
    } else {
      peerConn.ondatachannel = function(event) {
        console.log('ondatachannel:', event.channel);
        dataChannel = event.channel;
        onDataChannelCreated(dataChannel);
      };
    }
  }

  function onLocalSessionCreated(desc) {
    console.log('local session created:', desc);
    peerConn.setLocalDescription(desc).then(() => {
      console.log('sending local desc:', peerConn.localDescription);
      sendMessage(peerConn.localDescription);
    });
  }

  function onDataChannelCreated(channel) {
    console.log('onDataChannelCreated:', channel);

    channel.onopen = () => {
      console.log('CHANNEL opened!!!');
    };

    channel.onclose = () => {
      console.log('Channel closed.');
    };

    channel.onmessage = event => {
      console.log('Received some data');
      console.log(data);
      event.ports[0].postMessage(response);
      // document.getElementById("demo").innerHTML += '<br/>' + data.data;
    };
  }

  /****************************************************************************
   * Signaling server
   ****************************************************************************/

  // Connect to the signaling server
  let socket = io.connect();
  let isInitiator;

  socket.on('ipaddr', function(ipaddr) {
    console.log('Server IP address is: ' + ipaddr);
  });

  socket.on('created', function(room, clientId) {
    console.log('Created room', room, '- my client ID is', clientId);
    isInitiator = true;
  });

  socket.on('joined', function(room, clientId) {
    console.log('This peer has joined room', room, 'with client ID', clientId);
    isInitiator = false;
    createPeerConnection(isInitiator, STUN_SERVER);
  });

  socket.on('ready', function() {
    console.log('Socket is ready');
    createPeerConnection(isInitiator, STUN_SERVER);
  });

  socket.on('log', function(array) {
    console.log.apply(console, array);
  });

  socket.on('message', function(message) {
    console.log('Client received message:', message);
    signalingMessageCallback(message);
  });

  if (location.hostname.match(/localhost|127\.0\.0/)) {
    socket.emit('ipaddr');
  }

  /**
   * Send message to signaling server
   */
  function sendMessage(message) {
    console.log('Client sending message: ', message);
    socket.emit('message', message);
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
    var sendData = message;

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
  }

  var sendSyncedMessage = function(msg) {
    return new Promise(function(resolve, reject){
      // Create a Message Channel
      var msg_chan = new MessageChannel();

      // Handler for recieving message reply from service worker
      msg_chan.port1.onmessage = function(event){
        console.log("YEAH")
        resolve(event);
      };

      // Send message to service worker along with port for reply
      event.ports[0].postMessage(msg, [msg_chan.port2]);
    });
  }

  this.getRequestFromPeer = function(url) {
    return sendSyncedMessage(url).then(function(response) {
      console.log("AND THE ANSWER IS:")
      console.log(response.data);
    });

  }
}
