'use strict';

const os = require('os');
const fs = require('fs');
const nodeStatic = require('node-static');
const SignalServer = require('../src/signaling');
const https = require('https');

const port = 8080;
const clientPath = '../web_app';

const options = {
  key: fs.readFileSync('../assets/cert/signal.key'),
  cert: fs.readFileSync('../assets/cert/signal.crt')
};

const fileServer = new nodeStatic.Server(clientPath);

const signalServer = new SignalServer();

const app = https.createServer(options, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  fileServer.serve(req,res);
}).listen(port);

signalServer.start(app);
