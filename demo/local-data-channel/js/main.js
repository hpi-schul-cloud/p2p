$(document).ready(function () {
  var servers = []
  var localConnection;
  var remoteConnection;
  var sendChannel;
  var imageChannel;
  var receiveChannel;
  var dataConstraint;
  var dataChannelSend = document.querySelector("textarea");
  var dataChannelReceive = $('#receive');;
  var sendButton = $('#send');

  sendButton.click(sendData);

  function createConnection() {
    dataChannelSend.placeholder = '';
    var servers = null;
    dataConstraint = null;
    console.log('Using SCTP based data channels');

    window.localConnection = localConnection =
        new RTCPeerConnection(servers);
    console.log('Created local peer connection object localConnection');

      sendChannel = localConnection.createDataChannel('sendDataChannel',
        dataConstraint);
    imageChannel = localConnection.createDataChannel('imageDataChannel',
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
    if ( event.target.label === 'imageDataChannel' ){
      $('#test').append("<img src="+event.data+" />")
    } else if (event.target.label === 'sendDataChannel') {
      dataChannelReceive.val(event.data);
    }
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
    var textData = dataChannelSend.value;
    var imageData = $('#cdnImg').attr('src')
    sendChannel.send(textData);

    imageChannel.send(imageData)
  }

  function toDataUrl(url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
          var reader = new FileReader();
          reader.onloadend = function() {
              callback(reader.result);
          }
          reader.readAsDataURL(xhr.response);
      };
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      xhr.send();
  }

  function fetchImage(){
    $('cdnImg').each(function(_, img){
      toDataUrl($(img).attr('src'), function(base64Img) {
          $(img).parent().append("<img id='cdnImg' src="+base64Img+" />");
          $(img).remove();
      });
    })
  }

  createConnection();
  fetchImage();

})
