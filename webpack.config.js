const path = require('path');

module.exports = {
  entry: './build/src/p2pCDN.js',
  output: {
    filename: 'p2pCDN.js',
    path: path.resolve(__dirname, './build/src'),
    library: 'P2pCDN',
  },
  mode: 'production'
};
