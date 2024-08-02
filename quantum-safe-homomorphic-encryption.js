import { randomBytes } from 'crypto';

class LWEParams {
  constructor(n, q, σ) {
    this.n = n; // Lattice dimension
    this.q = q; // Modulus
    this.σ = σ; // Standard deviation for error distribution
  }
}

class QuantumSafeHomomorphicEncryption {
  constructor(params) {
    this.params = params;
  }

  // Helper function to generate random integers
  randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  // Helper function to sample from discrete Gaussian distribution
  sampleGaussian() {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += Math.random() - 0.5;
    }
    return Math.round(sum * this.params.σ);
  }

  // Generate key pair
  generateKeyPair() {
    const s = Array.from({ length: this.params.n }, () => this.randomInt(this.params.q));
    const A = Array.from({ length: this.params.n }, () => 
      Array.from({ length: this.params.n }, () => this.randomInt(this.params.q))
    );
    const e = Array.from({ length: this.params.n }, () => this.sampleGaussian());
    const b = A.map((row, i) => 
      (row.reduce((sum, a, j) => (sum + a * s[j]) % this.params.q, 0) + e[i]) % this.params.q
    );

    return { publicKey: { A, b }, secretKey: s };
  }

  // Encrypt a single bit
  encrypt(bit, publicKey) {
    const { A, b } = publicKey;
    const r = Array.from({ length: this.params.n }, () => this.randomInt(2));
    const u = r.reduce((acc, ri, i) => acc.map((v, j) => (v + ri * A[i][j]) % this.params.q), Array(this.params.n).fill(0));
    const v = (r.reduce((sum, ri, i) => sum + ri * b[i], 0) + Math.floor(this.params.q / 2) * bit) % this.params.q;
    return { u, v };
  }

  // Decrypt a ciphertext
  decrypt(ciphertext, secretKey) {
    const { u, v } = ciphertext;
    const decrypted = (v - u.reduce((sum, ui, i) => sum + ui * secretKey[i], 0)) % this.params.q;
    return Math.round(decrypted / (this.params.q / 2)) % 2;
  }

  // Homomorphic addition
  add(ct1, ct2) {
    return {
      u: ct1.u.map((u1i, i) => (u1i + ct2.u[i]) % this.params.q),
      v: (ct1.v + ct2.v) % this.params.q
    };
  }

  // Homomorphic multiplication (simplified, not noise-optimal)
  multiply(ct1, ct2) {
    const newU = Array(this.params.n * this.params.n).fill(0);
    for (let i = 0; i < this.params.n; i++) {
      for (let j = 0; j < this.params.n; j++) {
        newU[i * this.params.n + j] = (ct1.u[i] * ct2.u[j]) % this.params.q;
      }
    }
    const newV = (ct1.v * ct2.v) % this.params.q;
    return { u: newU, v: newV };
  }

  // Key switching (helper for bootstrapping, simplified version)
  keySwitch(ct, oldKey, newKey) {
    const switchingKey = oldKey.map(ski => 
      this.encrypt(ski, { A: newKey.A, b: newKey.b })
    );
    
    return switchingKey.reduce((acc, ski, i) => 
      this.add(acc, this.multiply(ski, { u: [ct.u[i]], v: 0 })), 
      { u: Array(this.params.n).fill(0), v: ct.v }
    );
  }

  // Bootstrapping (simplified, not production-ready)
  bootstrap(ct, oldKey, newKey) {
    // Decrypt and re-encrypt
    const bit = this.decrypt(ct, oldKey);
    const freshCt = this.encrypt(bit, { A: newKey.A, b: newKey.b });
    
    // Key switch back to the original key
    return this.keySwitch(freshCt, newKey.s, oldKey);
  }
}

// Example usage
const params = new LWEParams(512, 65537, 3.2);
const qshe = new QuantumSafeHomomorphicEncryption(params);

const { publicKey, secretKey } = qshe.generateKeyPair();

const bit1 = 1;
const bit2 = 0;

const ct1 = qshe.encrypt(bit1, publicKey);
const ct2 = qshe.encrypt(bit2, publicKey);

console.log("Encrypted bit 1:", ct1);
console.log("Encrypted bit 2:", ct2);

const decrypted1 = qshe.decrypt(ct1, secretKey);
const decrypted2 = qshe.decrypt(ct2, secretKey);

console.log("Decrypted bit 1:", decrypted1);
console.log("Decrypted bit 2:", decrypted2);

const sumCt = qshe.add(ct1, ct2);
const productCt = qshe.multiply(ct1, ct2);

console.log("Sum (encrypted):", sumCt);
console.log("Product (encrypted):", productCt);

const decryptedSum = qshe.decrypt(sumCt, secretKey);
const decryptedProduct = qshe.decrypt(productCt, secretKey);

console.log("Decrypted sum:", decryptedSum);
console.log("Decrypted product:", decryptedProduct);

// Bootstrapping example
const { publicKey: newPublicKey, secretKey: newSecretKey } = qshe.generateKeyPair();
const refreshedCt = qshe.bootstrap(sumCt, secretKey, { A: newPublicKey.A, b: newPublicKey.b, s: newSecretKey });

console.log("Refreshed ciphertext:", refreshedCt);
console.log("Decrypted refreshed ciphertext:", qshe.decrypt(refreshedCt, secretKey));

export default QuantumSafeHomomorphicEncryption;