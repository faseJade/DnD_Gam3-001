/* Dungeon of Shadows - Automated In-Browser Test Suite */

(function () {
  'use strict';

  function runTests() {
    const resultsContainer = document.getElementById('test-results');
    if (!resultsContainer) return;
    resultsContainer.innerHTML = '';

    let passedCount = 0;
    let failedCount = 0;

    function assert(condition, message) {
      const div = document.createElement('div');
      div.className = 'test-case';
      if (condition) {
        passedCount++;
        div.innerHTML = `<span class="pass">[PASS]</span> ${message}`;
      } else {
        failedCount++;
        div.innerHTML = `<span class="fail">[FAIL]</span> ${message}`;
      }
      resultsContainer.appendChild(div);
    }

    // 1. Seed Reproducibility
    const seed = 'test_seed_12345';
    const world1 = new window.DOS.WorldGenerator(seed).generate();
    const world2 = new window.DOS.WorldGenerator(seed).generate();

    assert(
      world1.settlements.length === world2.settlements.length &&
      world1.settlements[0].name === world2.settlements[0].name,
      'Same seed generates identical world settlements'
    );

    // 2. Different Seeds
    const worldDiff = new window.DOS.WorldGenerator('different_seed_999').generate();
    assert(
      world1.settlements[0].name !== worldDiff.settlements[0].name,
      'Different seeds generate different world settlements'
    );

    // 3. Dice Engine Range
    let validDice = true;
    for (let i = 0; i < 100; i++) {
      const d20 = window.DOS.rollDie(20);
      if (d20 < 1 || d20 > 20) { validDice = false; break; }

      const diceRes = window.DOS.rollDice('2d6+3');
      if (diceRes.total < 5 || diceRes.total > 15) { validDice = false; break; }
    }
    assert(validDice, 'rollDie(n) and rollDice("2d6+3") always stay within valid bounds');

    // 4. Character Validation & Stats Clamping
    const state = window.DOS.createInitialState('TestHero', 'Fighter', 'Dwarf', seed);
    assert(state.character.hp > 0, 'Initial HP is positive number');

    state.character.hp = -50;
    window.DOS.validateCharacter(state.character);
    assert(state.character.hp >= 0, 'Negative HP clamped to zero or valid bounds');

    // 5. Save & Load Roundtrip
    window.DOS.saveGame(state);
    const loadedState = window.DOS.loadGame();
    assert(
      loadedState && loadedState.character.name === 'TestHero',
      'Save/Load roundtrip preserves character state accurately'
    );

    // 6. Game Starts Without Errors Across 10 Seeds
    let start10Ok = true;
    for (let s = 1; s <= 10; s++) {
      try {
        const testSeed = `real_start_seed_${s}`;
        const st = window.DOS.createInitialState(`Hero_${s}`, 'Wizard', 'Elf', testSeed);
        const wGen = new window.DOS.WorldGenerator(st.worldSeed);
        const w = wGen.generate();
        const dGen = new window.DOS.DungeonGenerator(st.worldSeed);
        w.dungeons = dGen.generateWorldDungeons(w.terrain, w.settlements);
        if (!w || !w.settlements || w.settlements.length === 0 || !w.dungeons || w.dungeons.length === 0) {
          start10Ok = false;
        }
      } catch (err) {
        start10Ok = false;
      }
    }
    assert(start10Ok, 'Game starts without errors for 10 different seeds');

    // 7. Dungeon of Shadows Existence & Dark Knight Boss
    const testWorld = new window.DOS.WorldGenerator('boss_seed_777').generate();
    const dGen = new window.DOS.DungeonGenerator('boss_seed_777');
    testWorld.dungeons = dGen.generateWorldDungeons(testWorld.terrain, testWorld.settlements);
    const dosDungeon = testWorld.dungeons.find(d => d.id === 'dungeon_of_shadows');
    let dosTileMatches = false;
    if (dosDungeon) {
      const tile = testWorld.terrain.grid[dosDungeon.y * testWorld.terrain.width + dosDungeon.x];
      if (tile && tile.locationId === 'dungeon_of_shadows') dosTileMatches = true;
    }
    const dosRooms = dGen.generateRoomsForDungeon(dosDungeon, state);
    const dosLastRoom = dosRooms[dosRooms.length - 1];
    const dosBossIsDK = dosLastRoom && dosLastRoom.monster && dosLastRoom.monster.name === 'Dark Knight';
    assert(dosDungeon && dosTileMatches && dosBossIsDK, 'Dungeon of Shadows exists, has locationId set on tile, and Room 10 boss is Dark Knight');

    // 8. Real Room Types Coverage Check (Generator vs Handled List)
    let allGeneratedTypesValid = true;
    testWorld.dungeons.forEach(d => {
      const rooms = dGen.generateRoomsForDungeon(d, state);
      rooms.forEach(r => {
        if (!window.DOS.ROOM_TYPES.includes(r.type)) allGeneratedTypesValid = false;
      });
    });
    assert(allGeneratedTypesValid, 'Every room type generated across all dungeons is in DOS.ROOM_TYPES');

    // 9. BFS Reachability Check from Starting Town to all Settlements and Dungeons
    let reachabilityAllSeedsOk = true;
    for (let s = 1; s <= 10; s++) {
      const seedStr = `reach_seed_${s}`;
      const w = new window.DOS.WorldGenerator(seedStr).generate();
      const dg = new window.DOS.DungeonGenerator(seedStr);
      w.dungeons = dg.generateWorldDungeons(w.terrain, w.settlements);

      const startS = w.settlements[0];
      const grid = w.terrain.grid;
      const width = w.terrain.width;
      const height = w.terrain.height;

      // BFS to find reachable land tiles
      const visited = new Set();
      const queue = [{ x: startS.x, y: startS.y }];
      visited.add(`${startS.x},${startS.y}`);

      while (queue.length > 0) {
        const curr = queue.shift();
        const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        for (const dir of dirs) {
          const nx = curr.x + dir.x;
          const ny = curr.y + dir.y;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const key = `${nx},${ny}`;
            const tile = grid[ny * width + nx];
            if (!visited.has(key) && tile.biome && tile.biome !== 'ocean') {
              visited.add(key);
              queue.push({ x: nx, y: ny });
            }
          }
        }
      }

      // Assert all settlements & dungeons reachable
      w.settlements.forEach(st => {
        if (!visited.has(`${st.x},${st.y}`)) reachabilityAllSeedsOk = false;
      });
      w.dungeons.forEach(du => {
        if (!visited.has(`${du.x},${du.y}`)) reachabilityAllSeedsOk = false;
      });
    }
    assert(reachabilityAllSeedsOk, 'Every settlement and dungeon (including Dungeon of Shadows) is reachable via land BFS across 10 seeds');

    // 10. Real Potion Usage at Full HP
    const potState = window.DOS.createInitialState('PotHero', 'Fighter', 'Human', seed);
    potState.character.hp = potState.character.maxHp; // Full HP
    potState.inventory = [{ item: window.DOS.BASE_ITEMS.potion_health, quantity: 1 }];

    const potResult = window.DOS.usePotion(potState, 0);
    assert(
      potResult === false && potState.inventory[0].quantity === 1 && potState.character.hp === potState.character.maxHp,
      'DOS.usePotion at full HP returns false, consumes no potion, and leaves HP unchanged'
    );

    // 11. Save/Load Event Generator System Re-creation
    window.DOS.saveGame(potState);
    const loadedSt = window.DOS.loadGame();
    const reEvGen = new window.DOS.EventGenerator(loadedSt.worldSeed);
    const travelEv = reEvGen.checkTravelEvent(loadedSt, { danger: 3, hasRoad: false });
    assert(loadedSt && reEvGen && typeof travelEv !== 'undefined', 'After save -> load, event generator system re-initializes and fires travel events');

    // 12. Quests Target Verification
    const qGen = new window.DOS.QuestGenerator('quest_test_seed_99');
    const townQuests = qGen.generateTownQuests(testWorld.settlements[0], 1);
    let questsValid = townQuests.length > 0;
    townQuests.forEach(q => {
      if (!q.giverTownId || !testWorld.settlements.some(s => s.id === q.giverTownId)) questsValid = false;
    });
    assert(questsValid, 'Generated quests reference valid giver settlements in the world');

    // Summary
    const summary = document.createElement('h2');
    summary.innerHTML = `Tests Completed: ${passedCount + failedCount} | Passed: <span class="pass">${passedCount}</span> | Failed: <span class="fail">${failedCount}</span>`;
    resultsContainer.insertBefore(summary, resultsContainer.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
  } else {
    runTests();
  }

})();
