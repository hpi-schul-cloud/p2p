'use strict';

const STUN_SERVER = {
  'iceServers': [
    {
      'urls': 'stun:stun.l.google.com:19302'
    }
  ]
}

let peerConn = new RTCPeerConnection(STUN_SERVER);
let dataChannel = peerConn.createDataChannel('test');

peerConn.onicecandidate = function(event) {
  console.log('icecandidate event:', event);
  if (event.candidate) {
    socket.emit('send_offer',{
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
    });
  } else {
    console.log('End of candidates.');
  }
};

function createConnection(){
  dataChannel.onopen = function () {
    console.log("datachannel open");
  };

  peerConn.createOffer().then((sdp)=>{
    console.log('SDP - Offer');
    console.log(JSON.stringify(sdp));

    peerConn.setLocalDescription(sdp).then((dec) => {
      socket.emit('send_offer', sdp);
    });
  });

  peerConn.onicecandidate = (obj)=>{
    //console.log('onicecandidate');
    //console.log(JSON.stringify(obj.candidate));
  };
}

function setDataChannel(){
  peerConn.ondatachannel = function(event) {
    console.log('ondatachannel:', event.channel);
    dataChannel = event.channel;
  };

  dataChannel.onmessage = function (event) {
    console.log('########## RECEIVED SOME AWESOME DATA ##########');
    console.log(event.data);
  }
}

function sendData() {
  window.testData = prompt('Enter data:');
  dataChannel.send(testData);
}

// SIGNAL

let isInitiator;
const socket = io.connect();

function frontendPrint(str) {
  document.getElementById('demo').innerHTML += '<br/>' + str;
}

function joinCreate(){
  window.room = prompt('Enter room name:');
  if (room !== '') {
    console.log('Message from client: Asking to join room ' + room);
    socket.emit('create or join', room);
  }
}

socket.on('created', function(room, clientId) {
  isInitiator = true;
});

socket.on('received_offer', function(msg) {
  console.log('Client: offer received' );

  peerConn.setRemoteDescription(msg).then(() => {
    console.log('Client: remote description set' );

    // Todo: setup video etc

    peerConn.createAnswer().then((sdp) => {
      peerConn.setLocalDescription(sdp).then((dec) => {
        socket.emit('send_answer', sdp);
      });
    });
  });
});

socket.on('received_answer', function(msg) {
  console.log('Client: answer received');

  peerConn.setRemoteDescription(msg).then(() => {
    console.log('Session established');
  });
});

socket.on('full', function(room) {
  console.log('Message from client: Room ' + room + ' is full :^(');
});

socket.on('ipaddr', function(ipaddr) {
  console.log('Message from client: Server IP address is ' + ipaddr);
});

socket.on('joined', function(room, clientId) {
  isInitiator = false;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

socket.on('frontend', frontendPrint);