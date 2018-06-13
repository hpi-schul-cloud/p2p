node-minify --compressor babel-minify --input ./build/tmp/clientServiceWorker.js,./build/tmp/signaling.js,./build/tmp/webRTC.js,./build/tmp/p2pCDN.js --output ./web_app/js/p2pCDN.js

node-minify --compressor babel-minify --input ./build/tmp/utils.js --output ./web_app/js/utils.js