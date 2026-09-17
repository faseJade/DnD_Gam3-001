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
      const W = terrainData.width;
      const H = terrainData.height;
      // Find the closest free land tile (at least 3 tiles from the start town)
      let dosPos = null;
      for (let r = 3; r < Math.max(W, H) && !dosPos; r++) {
        for (let dy = -r; dy <= r && !dosPos; dy++) {
          for (let dx = -r; dx <= r && !dosPos; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x = startS.x + dx;
            const y = startS.y + dy;
            if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
            const t = terrainData.grid[y * W + x];
            if (t.biome && t.biome !== 'ocean' && !t.locationId) dosPos = { x, y };
          }
        }
      }
      if (!dosPos) dosPos = { x: startS.x, y: startS.y };
      const dosDungeon = {
        id: 'dungeon_of_shadows',
        name: 'Dungeon of Shadows',
        isSpecial: true,
        x: dosPos.x,
        y: dosPos.y,
        difficulty: 4,
        totalRooms: 10,
        regenCooldownDays: 10,
        desc: 'The legendary Dungeon of Shadows where the Dark Knight awaits at Room 10.'
      };
      dungeons.push(dosDungeon);
      const dosTile = terrainData.grid[dosPos.y * W + dosPos.x];
      if (dosTile && !dosTile.locationId) dosTile.locationId = dosDungeon.id;

      // 2. Procedural Dungeons scattered across the world on reachable land
      const grid = terrainData.grid;

      // Find all tiles reachable from startS via BFS
      const reachableSet = new Set();
      if (startS) {
        const q = [{ x: startS.x, y: startS.y }];
        reachableSet.add(`${startS.x},${startS.y}`);
        while (q.length > 0) {
          const curr = q.shift();
          const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
          for (const dir of dirs) {
            const nx = curr.x + dir.x;
            const ny = curr.y + dir.y;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
              const key = `${nx},${ny}`;
              const tile = grid[ny * W + nx];
              if (!reachableSet.has(key) && tile.biome && tile.biome !== 'ocean') {
                reachableSet.add(key);
                q.push({ x: nx, y: ny });
              }
            }
          }
        }
      }

      let count = 1;
      for (let y = 8; y < H - 8; y += 10) {
        for (let x = 8; x < W - 8; x += 10) {
          const tile = grid[y * W + x];
          if (tile.biome !== 'ocean' && !tile.locationId && reachableSet.has(`${x},${y}`)) {
            const theme = rng.pick(DUNGEON_THEMES);
            const id = `procedural_dungeon_${count}`;
            const dungeon = {
              id: id,
              name: `${theme.type} #${count++}`,
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
            title: `Subterranean Hall`,
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
