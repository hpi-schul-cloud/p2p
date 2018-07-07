const nodeStatic = require('node-static');
const ServerSignaling = require('../src/server/signaling');
const http = require('http');

const port = 8080;
const clientPath = './web_app';

const fileServer = new nodeStatic.Server(clientPath);

const signaling = new ServerSignaling();

const app = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  fileServer.serve(req,res);
}).listen(port);

signaling.start(app);
