
async function notifyPeers(hash, clientID, type) {
  var msg = {type: type, hash};
  var client = await clients.get(clientID);

  if(!client) return;

  client.postMessage(msg);
}

async function notifyPeersAboutAdd(hash, clientID) {
  notifyPeers(hash, clientID, 'addedResource');
}

async function notifyPeersAboutRemove(hash, clientID) {
  notifyPeers(hash, clientID, 'removedResource');
}
