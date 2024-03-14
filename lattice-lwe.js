const math = require('mathjs');

function randomNormal(mean = 0, stdDev = 1, n = 1) {
  let arr = [];
  for (let i = 0; i < n; i++) {
    let u = 1 - Math.random();
    let v = 1 - Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    arr.push(z * stdDev + mean);
  }
  return arr;
}

function stringToBinary(input) {
  return input
    .split('')
    .map(function (char) {
      return char.charCodeAt(0).toString(2).padStart(8, '0');
    })
    .join('');
}

function binaryToString(input) {
  let strs = input.match(/.{1,8}/g).map(function (byte) {
    return String.fromCharCode(parseInt(byte, 2));
  });
  return strs.join('');
}

function generateKeypair(n = 128, q = 101, stdDev = 3.2) {
  const A = math.randomInt([n, n], 0, q);
  const s = math.randomInt([n, 1], 0, q);
  const e = math.matrix(randomNormal(0, stdDev, n)).reshape([n, 1]);
  const b = math.mod(math.add(math.multiply(A, s), e), q);
  return { publicKey: [A, b], privateKey: s };
}

function encryptPart(messagePart, publicKey, q = 101, n = 128) {
  const [A, b] = publicKey;
  const m = math.reshape(messagePart, [n, 1]);
  const r = math.randomInt([n, 1], 0, 2);
  const u = math.mod(math.multiply(math.transpose(A), r), q);
  const v = math.mod(math.add(math.multiply(math.transpose(b), r), math.multiply(m, q / 2)), q);
  return { u, v };
}

function encrypt(message, publicKey, q = 101, n = 128) {
  const binaryMessage = stringToBinary(message);
  const binaryArray = Array.from(binaryMessage).map(Number);

  const messageLength = binaryArray.length;
  const paddedMessage = binaryArray.concat(Array(n - (messageLength % n)).fill(0));

  let encryptedMessageParts = [];
  for (let i = 0; i < paddedMessage.length; i += n) {
    const messagePart = paddedMessage.slice(i, i + n);
    const { u, v } = encryptPart(messagePart, publicKey, q, n);
    encryptedMessageParts.push({ u, v });
  }

  return { encryptedMessageParts, originalLength: messageLength };
}

function decryptPart(encryptedMessage, privateKey, q = 101, n = 128) {
  const { u, v } = encryptedMessage;
  const s = privateKey;
  const decryptionAttempt = math.mod(math.subtract(v, math.multiply(math.transpose(u), s)), q);
  const decryptedMessage = math.round(math.multiply(decryptionAttempt, 2 / q));
  return math.mod(decryptedMessage, 2);
}

function decrypt(encryptedData, privateKey, q = 101, n = 128) {
  const { encryptedMessageParts, originalLength } = encryptedData;
  let decryptedBinaryString = '';
  encryptedMessageParts.forEach(({ u, v }) => {
    const decryptedPart = decryptPart({ u, v }, privateKey, q, n);
    decryptedBinaryString += decryptedPart.toArray().join('');
  });
  decryptedBinaryString = decryptedBinaryString.substring(0, originalLength);
  return binaryToString(decryptedBinaryString);
}

// Example usage
(async () => {
  const { publicKey, privateKey } = generateKeypair(128);
  const message = 'Hello, Quantum World!';
  const encryptedMessage = encrypt(message, publicKey);
  const decryptedMessage = decrypt(encryptedMessage, privateKey);
  console.log('Original Message: ', message);
  console.log('Encrypted Message: ', JSON.stringify(encryptedMessage));
  console.log('Decrypted Message: ', decryptedMessage);
})();
