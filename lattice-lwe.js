import * as math from 'mathjs';

const PARAMS = {
  n: 128,
  q: 256,
  stdDev: 2.56,
};

function randomNormal(mean = 0, stdDev = PARAMS.stdDev, n = PARAMS.n) {
  return Array.from({ length: n }, () => {
    const u = 1 - Math.random();
    const v = 1 - Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  });
}

function stringToBinary(input) {
  return input
    .split('')
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
}

function binaryToString(input) {
  return input
    .match(/.{1,8}/g)
    .map((byte) => String.fromCharCode(parseInt(byte, 2)))
    .join('');
}

function generateKeypair() {
  const A = math.randomInt([PARAMS.n, PARAMS.n], 0, PARAMS.q);
  const s = math.randomInt([PARAMS.n, 1], 0, PARAMS.q);
  const e = math.matrix(randomNormal()).reshape([PARAMS.n, 1]);
  const b = math.mod(math.add(math.multiply(A, s), e), PARAMS.q);
  return { publicKey: [A, b], privateKey: s };
}

function encryptPart(messagePart, publicKey) {
  const [A, b] = publicKey;
  const m = math.reshape(messagePart, [PARAMS.n, 1]);
  const r = math.randomInt([PARAMS.n, 1], 0, 2);
  const u = math.mod(math.multiply(math.transpose(A), r), PARAMS.q);
  const v = math.mod(math.add(math.multiply(math.transpose(b), r), math.multiply(m, PARAMS.q / 2)), PARAMS.q);
  return { u, v };
}

function encrypt(message, publicKey) {
  const binaryMessage = stringToBinary(message);
  const binaryArray = Array.from(binaryMessage).map(Number);
  const messageLength = binaryArray.length;
  const paddedMessage = binaryArray.concat(Array(PARAMS.n - (messageLength % PARAMS.n)).fill(0));
  const encryptedMessageParts = [];

  for (let i = 0; i < paddedMessage.length; i += PARAMS.n) {
    const messagePart = paddedMessage.slice(i, i + PARAMS.n);
    const { u, v } = encryptPart(messagePart, publicKey);
    encryptedMessageParts.push({ u, v });
  }

  return { encryptedMessageParts, originalLength: messageLength };
}

function decryptPart(encryptedMessage, privateKey) {
  const { u, v } = encryptedMessage;
  const s = privateKey;
  const decryptionAttempt = math.mod(math.subtract(v, math.multiply(math.transpose(u), s)), PARAMS.q);
  const decryptedMessage = math.round(math.multiply(decryptionAttempt, 2 / PARAMS.q));
  return math.mod(decryptedMessage, 2);
}

function decrypt(encryptedData, privateKey) {
  const { encryptedMessageParts, originalLength } = encryptedData;
  const decryptedBinaryArray = encryptedMessageParts.flatMap(({ u, v }) => {
    const decryptedPart = decryptPart({ u, v }, privateKey);
    return decryptedPart.toArray();
  });

  const decryptedBinaryString = decryptedBinaryArray.slice(0, originalLength).join('');
  return binaryToString(decryptedBinaryString);
}

// Example usage
(async () => {
  const { publicKey, privateKey } = generateKeypair();
  const message = `Hello, Quantum World!`;
  const encryptedMessage = encrypt(message, publicKey);
  const decryptedMessage = decrypt(encryptedMessage, privateKey);
  console.log('Original Message: ', message);
  console.log('Encrypted Message: ', JSON.stringify(encryptedMessage));
  console.log('Decrypted Message: ', decryptedMessage);
})();

