'use strict';

const STUN_SERVER = {
  'iceServers': [
    {
      'urls': 'stun:stun.l.google.com:19302'
    }
  ]
}

/****************************************************************************
 * WebRTC peer connection and data channel
 ****************************************************************************/

let peerConn;
let dataChannel;

function signalingMessageCallback(message) {
  if (message.type === 'offer') {
    console.log('Got offer. Sending answer to peer.');
    peerConn.setRemoteDescription(message);
    peerConn.createAnswer(onLocalSessionCreated);

  } else if (message.type === 'answer') {
    console.log('Got answer.');
    peerConn.setRemoteDescription(message);

  } else if (message.type === 'candidate') {
    peerConn.addIceCandidate(message.candidate);

  }
}

function createPeerConnection(isInitiator, config) {
  console.log('Creating Peer connection as initiator?', isInitiator, 'config:',
      config);
  peerConn = new RTCPeerConnection(config);

// send any ice candidates to the other peer
  peerConn.onicecandidate = function(event) {
    console.log('icecandidate event:', event);
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates.');
    }
  };

  if (isInitiator) {
    console.log('Creating Data Channel');
    dataChannel = peerConn.createDataChannel('test');
    onDataChannelCreated(dataChannel);

    console.log('Creating an offer');
    peerConn.createOffer(onLocalSessionCreated);
  } else {
    console.log('NILS');
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

  channel.onopen = function() {
    console.log('CHANNEL opened!!!');
    sendBtn.disabled = false;
    snapAndSendBtn.disabled = false;
  };

  channel.onclose = function () {
    console.log('Channel closed.');
    sendBtn.disabled = true;
    snapAndSendBtn.disabled = true;
  }

  channel.onmessage = (data) => {
    console.log('Received some data');
    console.log(data);
  }
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

// socket.on('full', function(room) {
//   alert('Room ' + room + ' is full. We will create a new room for you.');
//   window.location.hash = '';
//   window.location.reload();
// });

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

// if (location.hostname.match(/localhost|127\.0\.0/)) {
//   socket.emit('ipaddr');
// }

// Leaving rooms and disconnecting from peers.
// socket.on('disconnect', function(reason) {
//   console.log(`Disconnected: ${reason}.`);
//   sendBtn.disabled = true;
//   snapAndSendBtn.disabled = true;
// });
//
// socket.on('bye', function(room) {
//   console.log(`Peer leaving room ${room}.`);
//   sendBtn.disabled = true;
//   snapAndSendBtn.disabled = true;
//   // If peer did not create the room, re-enter to be creator.
//   if (!isInitiator) {
//     window.location.reload();
//   }
// });

// window.addEventListener('unload', function() {
//   console.log(`Unloading window. Notifying peers in ${room}.`);
//   socket.emit('bye', room);
// });


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
window.channel = prompt('Room?');
socket.emit('create or join', channel);

function sendData(){
  console.log('Datachannel:', dataChannel);
}