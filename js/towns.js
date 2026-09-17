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

      // Eligible tiles: Plains, Beach, or Forest (elevation between 0.28 and 0.52)
      const eligible = [];
      for (let y = 5; y < height - 5; y++) {
        for (let x = 5; x < width - 5; x++) {
          const tile = grid[y * width + x];
          if ((tile.biome === 'plains' || tile.biome === 'beach' || tile.biome === 'forest') && !tile.hasRoad) {
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
