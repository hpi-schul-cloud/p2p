
async function notifyPeers(hash, clientID, type) {
  const msg = {type: type, hash};
  const client = await clients.get(clientID);

  client.postMessage(msg);
}

async function notifyPeersAboutAdd(hash, clientID) {
  notifyPeers(hash, clientID, 'addedResource');
}

async function notifyPeersAboutRemove(hash, clientID) {
  notifyPeers(hash, clientID, 'removedResource');
}
