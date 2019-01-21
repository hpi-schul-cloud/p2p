node-minify --compressor no-compress --input ./build/tmp/middleware.js,./build/tmp/signaling.js,./build/tmp/peer.js,./build/tmp/systemTest.js,./build/lib/modernizr.js --output ./build/src/p2pCDN.js

node-minify --compressor no-compress --input ./build/tmp/utils.js --output ./build/src/utils.js
