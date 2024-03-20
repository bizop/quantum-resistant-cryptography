const mathjs = require('mathjs');

class QZEHKEncryption {
  constructor(n, q, d, alpha) {
    this.n = n;
    this.q = q;
    this.d = d;
    this.alpha = alpha;
  }
  
  keygen() {
    const s = mathjs.randomInt([this.n, this.d], 0, this.q);
    const a = mathjs.randomInt([this.n, this.n, this.d], 0, this.q);
    const e = this.sampleError();
    const b = mathjs.mod(mathjs.add(mathjs.multiply(a, this.zetaEntangleHyperdimensional(s)), e), this.q);
    return { pk: { a, b }, sk: s };
  }

  encrypt(pk, m) {
    const { a, b } = pk;
    const r = mathjs.randomInt([this.n, this.d], 0, 2);
    const e1 = this.sampleError();
    const e2 = this.sampleError();
    const u = mathjs.mod(mathjs.add(mathjs.multiply(a, r), e1), this.q);
    const v = mathjs.mod(mathjs.add(mathjs.sumAll(mathjs.dotMultiply(b, this.zetaEntangleHyperdimensional(r))), mathjs.add(mathjs.multiply(this.q/2, m), e2)), this.q);
    return { u, v };
  }

  decrypt(sk, ct) {
    const { u, v } = ct;
    const d = mathjs.mod(mathjs.subtract(v, mathjs.sumAll(mathjs.dotMultiply(this.zetaEntangleHyperdimensional(sk), u))), this.q);
    const m = mathjs.round(d * 2 / this.q);
    return m;
  }

  sampleError() {
    const sigma = this.alpha * this.q / Math.sqrt(2 * Math.PI);
    const e = mathjs.complex(mathjs.random([this.d]), mathjs.random([this.d]));
    return mathjs.round(mathjs.multiply(sigma, mathjs.sqrt(mathjs.multiply(-2, mathjs.log(mathjs.abs(e)))), mathjs.exp(mathjs.multiply(mathjs.complex(0, 1), mathjs.arg(e)))));
  }

  zetaEntangleHyperdimensional(vec) {
    return mathjs.map(vec, (v, i) => mathjs.multiply(v, mathjs.pow(mathjs.multiply(mathjs.bignumber(1 - mathjs.pow(mathjs.bignumber(mathjs.fraction(1, mathjs.prime(i[0]+1))), mathjs.bignumber(v))), mathjs.riemann(mathjs.complex(1, mathjs.sin(i[1])))), -1)));
  }
}

// Example usage:
const qzehk = new QZEHKEncryption(32, 2053, 4, 8/2053);
const { pk, sk } = qzehk.keygen();
const message = 1;
const ciphertext = qzehk.encrypt(pk, message);  
const decrypted = qzehk.decrypt(sk, ciphertext);
console.log(decrypted);
