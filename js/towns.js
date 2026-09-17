/* Dungeon of Shadows - Settlement & Town Generator */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  const SETTLEMENT_TYPES = {
    CAPITAL: { id: 'capital', name: 'Capital City', symbol: '👑', minDist: 20, danger: 1 },
    CITY: { id: 'city', name: 'City', symbol: '🏰', minDist: 15, danger: 1 },
    TOWN: { id: 'town', name: 'Town', symbol: '🏘', minDist: 10, danger: 2 },
    VILLAGE: { id: 'village', name: 'Village', symbol: '🏡', minDist: 6, danger: 2 }
  };

  const TOWN_PREFIXES = ['Iron', 'Green', 'Silver', 'Black', 'Red', 'Oak', 'Stone', 'River', 'Sun', 'Frost', 'Shadow', 'Storm'];
  const TOWN_SUFFIXES = ['haven', 'rest', 'keep', 'water', 'vale', 'hold', 'crest', 'wood', 'ford', 'port', 'watch', 'burg'];

  class TownGenerator {
    constructor(worldSeed) {
      this.rng = new DOS.RNG(worldSeed).subRNG('towns');
    }

    generateName() {
      const p = this.rng.pick(TOWN_PREFIXES);
      const s = this.rng.pick(TOWN_SUFFIXES);
      return p + s.toLowerCase();
    }

    generateSettlements(terrainData) {
      const settlements = [];
      const { width, height, grid } = terrainData;

      // Find main connected land mass via BFS starting near map center
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      let centerLand = null;

      // Find land tile closest to center
      for (let r = 0; r < Math.max(width, height) && !centerLand; r++) {
        for (let dy = -r; dy <= r && !centerLand; dy++) {
          for (let dx = -r; dx <= r && !centerLand; dx++) {
            const tx = centerX + dx;
            const ty = centerY + dy;
            if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
              const tile = grid[ty * width + tx];
              if (tile.biome && tile.biome !== 'ocean') centerLand = tile;
            }
          }
        }
      }

      const mainLandSet = new Set();
      if (centerLand) {
        const q = [{ x: centerLand.x, y: centerLand.y }];
        mainLandSet.add(`${centerLand.x},${centerLand.y}`);
        while (q.length > 0) {
          const curr = q.shift();
          const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
          for (const dir of dirs) {
            const nx = curr.x + dir.x;
            const ny = curr.y + dir.y;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const key = `${nx},${ny}`;
              const tile = grid[ny * width + nx];
              if (!mainLandSet.has(key) && tile.biome && tile.biome !== 'ocean') {
                mainLandSet.add(key);
                q.push({ x: nx, y: ny });
              }
            }
          }
        }
      }

      // Eligible tiles: Plains, Beach, or Forest on the main land mass
      const eligible = [];
      for (let y = 5; y < height - 5; y++) {
        for (let x = 5; x < width - 5; x++) {
          const tile = grid[y * width + x];
          if ((tile.biome === 'plains' || tile.biome === 'beach' || tile.biome === 'forest') && !tile.hasRoad && mainLandSet.has(`${x},${y}`)) {
            eligible.push(tile);
          }
        }
      }

      this.rng.shuffle(eligible);

      // Define target counts
      const counts = [
        { type: SETTLEMENT_TYPES.CAPITAL, num: 1 },
        { type: SETTLEMENT_TYPES.CITY, num: 2 },
        { type: SETTLEMENT_TYPES.TOWN, num: 5 },
        { type: SETTLEMENT_TYPES.VILLAGE, num: 8 }
      ];

      let settlementIdCounter = 1;

      for (const group of counts) {
        for (let i = 0; i < group.num; i++) {
          let placedTile = null;

          for (const cand of eligible) {
            // Check minimum distance from existing settlements
            let tooClose = false;
            for (const existing of settlements) {
              const dx = cand.x - existing.x;
              const dy = cand.y - existing.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < group.type.minDist) {
                tooClose = true;
                break;
              }
            }

            if (!tooClose) {
              placedTile = cand;
              break;
            }
          }

          if (placedTile) {
            const id = `settlement_${settlementIdCounter++}`;
            const name = this.generateName();
            const settlement = {
              id: id,
              name: name,
              type: group.type.id,
              typeName: group.type.name,
              symbol: group.type.symbol,
              x: placedTile.x,
              y: placedTile.y,
              population: this.rng.int(100, 5000),
              desc: `${name} is a thriving ${group.type.name.toLowerCase()} situated in the ${placedTile.biome}.`,
              danger: group.type.danger,
              shops: ['inn', 'blacksmith', 'general_store', 'guild'],
              discovered: true
            };

            placedTile.locationId = id;
            settlements.push(settlement);
          }
        }
      }

      return settlements;
    }
  }

  DOS.SETTLEMENT_TYPES = SETTLEMENT_TYPES;
  DOS.TownGenerator = TownGenerator;

})(window.DOS);
