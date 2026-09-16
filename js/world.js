/* Dungeon of Shadows - World Generator Orchestrator */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  class WorldGenerator {
    constructor(worldSeed) {
      this.worldSeed = worldSeed;
    }

    generate() {
      // 1. Generate Terrain
      const terrainGen = new DOS.TerrainGenerator(this.worldSeed);
      const terrain = terrainGen.generate();

      // 2. Generate Settlements
      const townGen = new DOS.TownGenerator(this.worldSeed);
      const settlements = townGen.generateSettlements(terrain);

      // 3. Connect Settlements with Roads
      DOS.connectSettlements(settlements, terrain);

      // Starting settlement (Capital or first town)
      const startingSettlement = settlements[0];

      return {
        seed: this.worldSeed,
        terrain: terrain,
        settlements: settlements,
        dungeons: [], // Populated in Phase 4
        startingPos: { x: startingSettlement.x, y: startingSettlement.y }
      };
    }
  }

  DOS.WorldGenerator = WorldGenerator;

})(window.DOS);
