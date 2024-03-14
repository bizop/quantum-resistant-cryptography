const math = require('mathjs');

function generateKeypair(n = 10, q = 101, stdDev = 3.2) {
  const A = math.randomInt([n, n], 0, q);
  const s = math.randomInt([n, 1], 0, q);
  const e = math.mod(math.floor(math.randomNormal([n, 1], 0, stdDev)), q);
  const b = math.mod(math.add(math.multiply(A, s), e), q);
  return { publicKey: [A, b], privateKey: s };
}

function encrypt(message, publicKey, q = 101, n = 10) {
  const [A, b] = publicKey;
  const m = math.matrix(message).reshape([n, 1]);
  const r = math.randomInt([n, 1], 0, 2); // Random binary vector
  const u = math.mod(math.multiply(math.transpose(A), r), q);
  const v = math.mod(math.add(math.multiply(math.transpose(b), r), math.multiply(math.transpose(m), math.ones([n, 1]).map((_) => q / 2))), q);
  return { u, v };
}

function decrypt(encryptedMessage, privateKey, q = 101, n = 10) {
  const { u, v } = encryptedMessage;
  const s = privateKey;
  const decryptionAttempt = math.mod(math.subtract(v, math.multiply(math.transpose(u), s)), q);
  const decryptedMessage = math.mod(math.round(math.multiply(2, decryptionAttempt) / q), 2);
  return decryptedMessage._data;
}

// Example usage
const { publicKey, privateKey } = generateKeypair();
const message = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]; // Example message
const encryptedMessage = encrypt(message, publicKey);
const decryptedMessage = decrypt(encryptedMessage, privateKey);
console.log("Original Message: ", message);
console.log("Decrypted Message: ", decryptedMessage);
