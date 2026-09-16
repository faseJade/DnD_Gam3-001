/* Dungeon of Shadows - Terrain Generator */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  // Simple 2D Value Noise generator
  class ValueNoise2D {
    constructor(rng) {
      this.gridSize = 256;
      this.p = new Uint8Array(512);
      const perm = new Uint8Array(256);
      for (let i = 0; i < 256; i++) perm[i] = i;
      // Shuffle using RNG
      for (let i = 255; i > 0; i--) {
        const j = rng.int(0, i);
        [perm[i], perm[j]] = [perm[j], perm[i]];
      }
      for (let i = 0; i < 512; i++) {
        this.p[i] = perm[i & 255];
      }
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }

    eval(x, y) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;

      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);

      const u = this.fade(xf);
      const v = this.fade(yf);

      const aa = this.p[this.p[X] + Y];
      const ab = this.p[this.p[X] + Y + 1];
      const ba = this.p[this.p[X + 1] + Y];
      const bb = this.p[this.p[X + 1] + Y + 1];

      const x1 = this.lerp(u, aa / 255.0, ba / 255.0);
      const x2 = this.lerp(u, ab / 255.0, bb / 255.0);

      return this.lerp(v, x1, x2);
    }

    fbm(x, y, octaves = 4, persistence = 0.5) {
      let total = 0;
      let frequency = 1;
      let amplitude = 1;
      let maxValue = 0;
      for (let i = 0; i < octaves; i++) {
        total += this.eval(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= 2;
      }
      return total / maxValue;
    }
  }

  const BIOMES = {
    OCEAN: { id: 'ocean', name: 'Ocean', color: '#1a365d', symbol: '~', passable: false, danger: 0, moveCost: 99 },
    BEACH: { id: 'beach', name: 'Sand Beach', color: '#e2e8f0', symbol: '.', passable: true, danger: 1, moveCost: 1.2 },
    PLAINS: { id: 'plains', name: 'Plains', color: '#808000', symbol: '″', passable: true, danger: 1, moveCost: 1.0 },
    FARMLAND: { id: 'farmland', name: 'Farmland', color: '#a0a000', symbol: '🌾', passable: true, danger: 1, moveCost: 1.0 },
    FOREST: { id: 'forest', name: 'Forest', color: '#2e7d32', symbol: '♣', passable: true, danger: 2, moveCost: 1.4 },
    DENSE_FOREST: { id: 'dense_forest', name: 'Dense Forest', color: '#1b5e20', symbol: '♠', passable: true, danger: 4, moveCost: 1.8 },
    SWAMP: { id: 'swamp', name: 'Swamp', color: '#4a5d4e', symbol: '≈', passable: true, danger: 5, moveCost: 2.0 },
    HILLS: { id: 'hills', name: 'Hills', color: '#a1887f', symbol: '∩', passable: true, danger: 3, moveCost: 1.5 },
    MOUNTAINS: { id: 'mountains', name: 'Mountains', color: '#5d4037', symbol: '▲', passable: true, danger: 6, moveCost: 2.5 },
    SNOW_MOUNTAINS: { id: 'snow_mountains', name: 'Snowy Peak', color: '#eceff1', symbol: '▲', passable: true, danger: 8, moveCost: 3.5 },
    DESERT: { id: 'desert', name: 'Desert', color: '#d7ccc8', symbol: '∴', passable: true, danger: 4, moveCost: 1.6 },
    RUINS: { id: 'ruins', name: 'Ancient Ruins', color: '#78909c', symbol: '🏛', passable: true, danger: 7, moveCost: 1.3 }
  };

  class TerrainGenerator {
    constructor(worldSeed, width = 96, height = 64) {
      this.width = width;
      this.height = height;
      this.rng = new DOS.RNG(worldSeed).subRNG('terrain');
      this.elevNoise = new ValueNoise2D(this.rng.subRNG('elev'));
      this.moistNoise = new ValueNoise2D(this.rng.subRNG('moist'));
    }

    generate() {
      const grid = new Array(this.width * this.height);
      const cx = this.width / 2;
      const cy = this.height / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          // Radial falloff to shape an island
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
          const falloff = Math.pow(dist, 1.8);

          let elev = this.elevNoise.fbm(x / 18, y / 18, 4, 0.5);
          elev = Math.max(0, elev - falloff * 0.75);

          const moist = this.moistNoise.fbm(x / 14, y / 14, 3, 0.5);

          let biome = BIOMES.OCEAN;

          if (elev > 0.88) {
            biome = BIOMES.SNOW_MOUNTAINS;
          } else if (elev > 0.70) {
            biome = BIOMES.MOUNTAINS;
          } else if (elev > 0.55) {
            biome = BIOMES.HILLS;
          } else if (elev > 0.28) {
            if (moist > 0.68) {
              biome = BIOMES.SWAMP;
            } else if (moist > 0.52) {
              biome = BIOMES.DENSE_FOREST;
            } else if (moist > 0.38) {
              biome = BIOMES.FOREST;
            } else if (moist < 0.20) {
              biome = BIOMES.DESERT;
            } else {
              biome = BIOMES.PLAINS;
            }
          } else if (elev > 0.24) {
            biome = BIOMES.BEACH;
          }

          grid[y * this.width + x] = {
            x: x,
            y: y,
            elevation: elev,
            moisture: moist,
            biome: biome.id,
            danger: biome.danger,
            hasRoad: false,
            locationId: null
          };
        }
      }

      return {
        width: this.width,
        height: this.height,
        grid: grid
      };
    }
  }

  DOS.BIOMES = BIOMES;
  DOS.TerrainGenerator = TerrainGenerator;

})(window.DOS);
