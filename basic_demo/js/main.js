$(document).ready(function () {
  var servers = []
  var localConnection;
  var remoteConnection;
  var sendChannel;
  var receiveChannel;
  var dataConstraint;
  var dataChannelSend = document.querySelector("textarea");
  var dataChannelReceive = $('#receive');;
  //var startButton = document.querySelector('button#startButton');
  var sendButton = $('#send');
  //var closeButton = document.querySelector('button#closeButton');

  sendButton.click(sendData);

  function createConnection() {
    dataChannelSend.placeholder = '';
    var servers = null;
    dataConstraint = null;
    console.log('Using SCTP based data channels');
    // SCTP is supported from Chrome 31 and is supported in FF.
    // No need to pass DTLS constraint as it is on by default in Chrome 31.
    // For SCTP, reliable and ordered is true by default.
    // Add localConnection to global scope to make it visible
    // from the browser console.
    window.localConnection = localConnection =
        new RTCPeerConnection(servers);
    console.log('Created local peer connection object localConnection');

    sendChannel = localConnection.createDataChannel('sendDataChannel',
        dataConstraint);
    console.log('Created send data channel');

    localConnection.onicecandidate = function(e) {
      onIceCandidate(localConnection, e);
    };
    sendChannel.onopen = onSendChannelStateChange;
    sendChannel.onclose = onSendChannelStateChange;

    // Add remoteConnection to global scope to make it visible
    // from the browser console.
    window.remoteConnection = remoteConnection =
        new RTCPeerConnection(servers);
    console.log('Created remote peer connection object remoteConnection');

    remoteConnection.onicecandidate = function(e) {
      onIceCandidate(remoteConnection, e);
    };
    remoteConnection.ondatachannel = receiveChannelCallback;

    localConnection.createOffer().then(
      gotDescription1,
      onCreateSessionDescriptionError
    );
  }

  function gotDescription1(desc) {
    localConnection.setLocalDescription(desc);
    console.log('Offer from localConnection \n' + desc.sdp);
    remoteConnection.setRemoteDescription(desc);
    remoteConnection.createAnswer().then(
      gotDescription2,
      onCreateSessionDescriptionError
    );
  }

  function gotDescription2(desc) {
    remoteConnection.setLocalDescription(desc);
    console.log('Answer from remoteConnection \n' + desc.sdp);
    localConnection.setRemoteDescription(desc);
  }

  function getOtherPc(pc) {
    return (pc === localConnection) ? remoteConnection : localConnection;
  }

  function getName(pc) {
    return (pc === localConnection) ? 'localPeerConnection' :
        'remotePeerConnection';
  }

  function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
  }


  function onIceCandidate(pc, event) {
    getOtherPc(pc).addIceCandidate(event.candidate)
    .then(
      function() {
        onAddIceCandidateSuccess(pc);
      },
      function(err) {
        onAddIceCandidateError(pc, err);
      }
    );
    console.log(getName(pc) + ' ICE candidate: \n' + (event.candidate ?
        event.candidate.candidate : '(null)'));
  }

  function onAddIceCandidateSuccess() {
    console.log('AddIceCandidate success.');
  }

  function onAddIceCandidateError(error) {
    console.log('Failed to add Ice Candidate: ' + error.toString());
  }

  function receiveChannelCallback(event) {
    console.log('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
  }

  function onReceiveMessageCallback(event) {
    console.log('Received Message');
    dataChannelReceive.val(event.data);
  }

  function onSendChannelStateChange() {
    var readyState = sendChannel.readyState;
    console.log('Send channel state is: ' + readyState);
  }

  function onReceiveChannelStateChange() {
    var readyState = receiveChannel.readyState;
    console.log('Receive channel state is: ' + readyState);
  }

  function sendData () {
    var data = dataChannelSend.value;
    sendChannel.send(data);
  }

  // pc.ondatachannel = function(event) {
  //   receiveChannel = event.channel;
  //   receiveChannel.onmessage = function(event){
  //     $("#receive").innerHTML = event.data;
  //   };
  // };

  createConnection();
})
