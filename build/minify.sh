node-minify --compressor no-compress --input ./build/tmp/middleware.js,./build/lib/debug.js,./build/tmp/signaling.js,./build/tmp/peer.js,./build/tmp/systemTest.js,./build/tmp/p2pCDN.js,./build/lib/modernizr.js --output ./build/src/p2pCDN.js

node-minify --compressor no-compress --input ./build/tmp/utils.js --output ./build/src/utils.js
