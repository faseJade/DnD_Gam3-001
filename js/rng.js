/* Dungeon of Shadows - Seeded Random Number Generator & Hashing */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  // String hashing helper (cyrb53)
  function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }

  // sfc32 Pseudo-Random Number Generator
  function sfc32(a, b, c, d) {
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      let t = (a + b | 0) + d | 0;
      d = d + 1 | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = c << 21 | c >>> 11;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    };
  }

  class RNG {
    constructor(seedStringOrNumber) {
      this.setSeed(seedStringOrNumber);
    }

    setSeed(seedInput) {
      if (typeof seedInput === 'number') {
        this.seedStr = String(seedInput);
      } else if (typeof seedInput === 'string' && seedInput.trim().length > 0) {
        this.seedStr = seedInput.trim();
      } else {
        this.seedStr = String(Math.floor(Math.random() * 1000000000));
      }

      const h1 = cyrb53(this.seedStr, 0);
      const h2 = cyrb53(this.seedStr, 1);
      const h3 = cyrb53(this.seedStr, 2);
      const h4 = cyrb53(this.seedStr, 3);

      this.generator = sfc32(h1, h2, h3, h4);
    }

    // Returns float in [0, 1)
    random() {
      return this.generator();
    }

    // Returns integer in [min, max]
    int(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(this.random() * (max - min + 1)) + min;
    }

    // Pick random element from array
    pick(array) {
      if (!array || array.length === 0) return null;
      return array[this.int(0, array.length - 1)];
    }

    // Shuffle array deterministically (Fisher-Yates)
    shuffle(array) {
      const arr = array.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = this.int(0, i);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // Create a sub-RNG derived deterministically from this seed + keys
    subRNG(...keys) {
      const combined = [this.seedStr, ...keys].join(':');
      return new RNG(combined);
    }
  }

  DOS.hash = cyrb53;
  DOS.RNG = RNG;

})(window.DOS);
