node-minify --compressor no-compress --input ./build/lib/idb-keyval.js,./build/lib/debug.js,./build/tmp/middleware.js,./build/tmp/signaling.js,./build/tmp/peer.js,./build/tmp/systemTest.js,./build/tmp/p2pCDN.js,./build/tmp/FayeConnection.js,./build/lib/modernizr.js,./build/tmp/utils.js --output ./build/src/p2pCDN.js
node-minify --compressor no-compress --input ./build/lib/idb-keyval.js,./src/client/js/p2pCDNsw.js,./build/tmp/utils.js,./src/client/js/swPeerNotifications.js --output ./build/src/p2pCDNsw.js
npx webpack
cp ./build/src/p2pCDN.js ./vendor/assets/javascript/p2pCDN.js
cp ./build/src/p2pCDNsw.js ./public/p2pCDNsw.js
