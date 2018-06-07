// Connect to the signaling server
const socket = io.connect();
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
  // console.log.apply(console, array);
});

socket.on('message', function(message) {
  // console.log('Client received message:', message);
  signalingMessageCallback(message);
});

if (location.hostname.match(/localhost|127\.0\.0/)) {
  socket.emit('ipaddr');
}

/**
 * Send message to signaling server
 */
function sendMessage(message) {
  // console.log('Client sending message: ', message);
  socket.emit('message', message);
}