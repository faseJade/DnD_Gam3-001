/* Dungeon of Shadows - Procedural Dungeons & Regeneration Engine */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  const DUNGEON_THEMES = [
    { type: 'Goblin Cave', difficulty: 2, monster: 'Goblin', desc: 'Damp cavern smelling of dark fungi and mischievous goblins.' },
    { type: 'Ancient Crypt', difficulty: 4, monster: 'Skeleton', desc: 'A dusty tomb surrounded by rattling undead bones.' },
    { type: 'Spider Nest', difficulty: 5, monster: 'GiantSpider', desc: 'Chitinous cobwebs coat every doorway in this subterranean nest.' },
    { type: 'Orc Stronghold', difficulty: 6, monster: 'Orc', desc: 'Fortified stone walls clashing with crude iron axes.' },
    { type: 'Abyssal Keep', difficulty: 8, monster: 'DarkKnight', desc: 'An ancient obsidian keep pulsing with dark magical energy.' }
  ];

  class DungeonGenerator {
    constructor(worldSeed) {
      this.worldSeed = worldSeed;
    }

    generateWorldDungeons(terrainData, settlements) {
      const dungeons = [];
      const rng = new DOS.RNG(this.worldSeed).subRNG('dungeons');

      // 1. Hand-crafted Special Dungeon: The Dungeon of Shadows (Dark Knight Arc)
      // Placed near starting area
      const startS = settlements[0];
      const dosDungeon = {
        id: 'dungeon_of_shadows',
        name: 'Dungeon of Shadows',
        isSpecial: true,
        x: Math.min(terrainData.width - 2, startS.x + 3),
        y: Math.min(terrainData.height - 2, startS.y + 3),
        difficulty: 4,
        totalRooms: 10,
        regenCooldownDays: 10,
        desc: 'The legendary Dungeon of Shadows where the Dark Knight awaits at Room 10.'
      };
      dungeons.push(dosDungeon);

      // 2. Procedural Dungeons scattered across the world
      let count = 1;
      for (let y = 8; y < terrainData.height - 8; y += 12) {
        for (let x = 8; x < terrainData.width - 8; x += 12) {
          const tile = terrainData.grid[y * terrainData.width + x];
          if (tile.biome !== 'ocean' && !tile.locationId) {
            const theme = rng.pick(DUNGEON_THEMES);
            const id = `procedural_dungeon_${count++}`;
            const dungeon = {
              id: id,
              name: `${theme.type} #${count}`,
              isSpecial: false,
              x: x,
              y: y,
              theme: theme.type,
              difficulty: theme.difficulty,
              totalRooms: 8 + theme.difficulty,
              regenCooldownDays: 7 + theme.difficulty,
              desc: theme.desc
            };
            tile.locationId = id;
            dungeons.push(dungeon);
          }
        }
      }

      return dungeons;
    }

    generateRoomsForDungeon(dungeon, state) {
      const dKey = dungeon.id;
      const dState = state.dungeons[dKey] || { regenCount: 0, cleared: false };
      const seedKey = `${this.worldSeed}:dungeon:${dKey}:${dState.regenCount}`;
      const rng = new DOS.RNG(seedKey);

      const rooms = [];
      for (let i = 1; i <= dungeon.totalRooms; i++) {
        if (i === dungeon.totalRooms) {
          // Final Boss Room
          let bossKey = dungeon.isSpecial ? 'DarkKnight' : (dungeon.difficulty >= 6 ? 'DarkKnight' : 'Orc');
          const template = DOS.MONSTER_CATALOG ? DOS.MONSTER_CATALOG[bossKey] : null;
          rooms.push({
            roomNumber: i,
            title: `Final Chamber`,
            type: 'monster',
            cleared: false,
            monster: template ? JSON.parse(JSON.stringify(template)) : null,
            desc: `You stand in the deepest chamber of ${dungeon.name} before the boss!`
          });
        } else {
          const rType = rng.pick(['monster', 'treasure', 'trap', 'shrine', 'empty']);
          let monster = null;
          if (rType === 'monster') {
            const mName = rng.pick(['Goblin', 'Skeleton', 'GiantSpider', 'Orc']);
            const template = DOS.MONSTER_CATALOG ? DOS.MONSTER_CATALOG[mName] : null;
            monster = template ? JSON.parse(JSON.stringify(template)) : null;
          }
          rooms.push({
            roomNumber: i,
            title: `Room ${i}: Subterranean Hall`,
            type: rType,
            cleared: false,
            monster: monster,
            desc: `A dark room inside ${dungeon.name}.`
          });
        }
      }

      return rooms;
    }
  }

  DOS.DungeonGenerator = DungeonGenerator;

})(window.DOS);
