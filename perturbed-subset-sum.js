const mathjs = require('mathjs');

class PSSEncryption {
  constructor(n, q, k, alpha) {
    this.n = n;
    this.q = q;
    this.k = k; 
    this.alpha = alpha;
  }
  
  keygen() {
    const s = mathjs.randomInt([this.n], 0, this.q);
    const a = mathjs.randomInt([this.n, this.k], 0, this.q);
    const e = this.sampleError();
    const b = mathjs.mod(mathjs.add(mathjs.multiply(a, mathjs.subset(s, mathjs.index(mathjs.range(0, this.k)))), e), this.q);
    return { pk: { a, b }, sk: s };
  }

  encrypt(pk, m) {
    const { a, b } = pk;
    const r = mathjs.randomInt([this.k], 0, 2);
    const e1 = this.sampleError();
    const e2 = this.sampleError();
    const u = mathjs.mod(mathjs.add(mathjs.multiply(a, r), e1), this.q);
    const v = mathjs.mod(mathjs.add(mathjs.dot(b, r), mathjs.add(mathjs.multiply(this.q/2, m), e2)), this.q);
    return { u, v };
  }

  decrypt(sk, ct) {
    const { u, v } = ct;
    const d = mathjs.mod(mathjs.subtract(v, mathjs.dot(mathjs.subset(sk, mathjs.index(mathjs.range(0, this.k))), u)), this.q);
    const m = mathjs.round(d * 2 / this.q);
    return m;
  }

  sampleError() {
    const sigma = this.alpha * this.q / Math.sqrt(2 * Math.PI);
    const e = mathjs.round(mathjs.multiply(mathjs.sqrt(mathjs.multiply(-2, mathjs.log(mathjs.random()))), mathjs.cos(mathjs.multiply(2 * Math.PI, mathjs.random()))));
    return mathjs.mod(e, this.q);
  }
}

// Example usage:
const pss = new PSSEncryption(1024, 12289, 64, 8/12289);
const { pk, sk } = pss.keygen();
const message = 1;
const ciphertext = pss.encrypt(pk, message);  
const decrypted = pss.decrypt(sk, ciphertext);
console.log(decrypted);
