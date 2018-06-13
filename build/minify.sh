node-minify --compressor babel-minify --input ./build/tmp/middleware.js,./build/tmp/signaling.js,./build/tmp/peer.js,./build/tmp/p2pCDN.js --output ./web_app/js/p2pCDN.js

node-minify --compressor babel-minify --input ./build/tmp/utils.js --output ./web_app/js/utils.js