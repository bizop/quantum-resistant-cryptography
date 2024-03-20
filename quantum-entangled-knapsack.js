const mathjs = require('mathjs');

class QEKEncryption {
  constructor(n, q, alpha) {
    this.n = n;
    this.q = q;
    this.alpha = alpha;
  }
  
  keygen() {
    const s = mathjs.randomInt([this.n], 0, this.q);
    const a = mathjs.randomInt([this.n, this.n], 0, this.q);
    const e = this.sampleError();
    const b = mathjs.mod(mathjs.add(mathjs.multiply(a, this.zetaEntangle(s)), e), this.q);
    return { pk: { a, b }, sk: s };
  }

  encrypt(pk, m) {
    const { a, b } = pk;
    const r = mathjs.randomInt([this.n], 0, 2);
    const e1 = this.sampleError();
    const e2 = this.sampleError();
    const u = mathjs.mod(mathjs.add(mathjs.multiply(a, r), e1), this.q);
    const v = mathjs.mod(mathjs.add(mathjs.dot(b, this.zetaEntangle(r)), mathjs.add(mathjs.multiply(this.q/2, m), e2)), this.q);
    return { u, v };
  }

  decrypt(sk, ct) {
    const { u, v } = ct;
    const d = mathjs.mod(mathjs.subtract(v, mathjs.dot(this.zetaEntangle(sk), u)), this.q);
    const m = mathjs.round(d * 2 / this.q);
    return m;
  }

  sampleError() {
    const sigma = this.alpha * this.q / Math.sqrt(2 * Math.PI);
    const e = mathjs.complex(mathjs.random(), mathjs.random());
    return mathjs.round(mathjs.multiply(sigma, mathjs.sqrt(mathjs.multiply(-2, mathjs.log(mathjs.abs(e)))), mathjs.exp(mathjs.multiply(mathjs.complex(0, 1), mathjs.arg(e)))));
  }

  zetaEntangle(vec) {
    return mathjs.map(vec, (v, i) => mathjs.multiply(v, mathjs.pow(mathjs.bignumber(1 - mathjs.pow(mathjs.bignumber(mathjs.fraction(1, mathjs.prime(i+1))), mathjs.bignumber(v))), -1)));
  }
}

// Example usage:
const qek = new QEKEncryption(64, 1031, 8/1031);
const { pk, sk } = qek.keygen();
const message = 1;
const ciphertext = qek.encrypt(pk, message);  
const decrypted = qek.decrypt(sk, ciphertext);
console.log(decrypted);
