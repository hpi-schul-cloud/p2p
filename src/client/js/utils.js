function toHex(buffer) {
  const hexCodes = [];
  const view = new DataView(buffer);

  for (let i = 0; i < view.byteLength; i += 4) {
    const value = view.getUint32(i);
    const stringValue = value.toString(16);
    const padding = '00000000';
    const paddedValue = (padding + stringValue).slice(-padding.length);

    hexCodes.push(paddedValue);
  }
  // Join all the hex strings into one
  return hexCodes.join('');
}

function sha256(str) {
  const buffer = new TextEncoder('utf-8').encode(str);

  return crypto.subtle.digest('SHA-256', buffer).then(hash => {
    return toHex(hash);
  });
}

function abToStr(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function strToAb(input) {
  let str = input;
  if (typeof input === 'number')
    str = input.toString();

  const buf = new ArrayBuffer(str.length); // 1 bytes for each char
  const bufView = new Uint8Array(buf);

  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }

  return buf;
}

function concatAbs(abs) {
  let byteLength = 0;
  let length = 0;

  abs.forEach(ab => {
    byteLength += ab.byteLength;
  });

  const result = new Uint8Array(byteLength);

  abs.forEach(ab => {
    result.set(new Uint8Array(ab), length);
    length += ab.byteLength;
  });

  return result;
}
