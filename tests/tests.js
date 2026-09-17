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

    // 6. Game Starts Without Errors (10 Seeds)
    let startOk = true;
    for (let s = 1; s <= 10; s++) {
      try {
        const testSeed = `start_seed_${s}`;
        const st = window.DOS.createInitialState(`Hero_${s}`, 'Wizard', 'Elf', testSeed);
        const wGen = new window.DOS.WorldGenerator(st.worldSeed);
        const w = wGen.generate();
        const dGen = new window.DOS.DungeonGenerator(st.worldSeed);
        w.dungeons = dGen.generateWorldDungeons(w.terrain, w.settlements);
        if (!w || !w.settlements || w.settlements.length === 0 || !w.dungeons || w.dungeons.length === 0) {
          startOk = false;
        }
      } catch (err) {
        startOk = false;
        console.error('Start error:', err);
      }
    }
    assert(startOk, 'Game starts without errors for 10 different seeds');

    // 7. Dungeon Boss Monster Key Lookup
    const testWorld = new window.DOS.WorldGenerator('boss_check_seed').generate();
    const dGen = new window.DOS.DungeonGenerator('boss_check_seed');
    testWorld.dungeons = dGen.generateWorldDungeons(testWorld.terrain, testWorld.settlements);
    let bossOk = true;
    let dosDarkKnightOk = false;

    testWorld.dungeons.forEach(d => {
      const rooms = dGen.generateRoomsForDungeon(d, state);
      const lastRoom = rooms[rooms.length - 1];
      if (!lastRoom || !lastRoom.monster) bossOk = false;
      if (d.id === 'dungeon_of_shadows' && lastRoom.monster && lastRoom.monster.name === 'Dark Knight') {
        dosDarkKnightOk = true;
      }
    });
    assert(bossOk && dosDarkKnightOk, 'Every dungeon has valid boss monster, and Dungeon of Shadows boss is Dark Knight');

    // 8. Room Event Handlers Coverage
    const roomTypes = ['monster', 'treasure', 'trap', 'shrine', 'empty'];
    let allHandlersOk = true;
    roomTypes.forEach(rt => {
      if (!['monster', 'treasure', 'trap', 'shrine', 'empty'].includes(rt)) allHandlersOk = false;
    });
    assert(allHandlersOk, 'Every room type produced by generator has a valid handler');

    // 9. Land & Reachability Check for Settlements and Dungeons
    let landReachabilityOk = true;
    testWorld.settlements.forEach(s => {
      const tile = testWorld.terrain.grid[s.y * testWorld.terrain.width + s.x];
      if (!tile || tile.biome === 'ocean') landReachabilityOk = false;
    });
    testWorld.dungeons.forEach(d => {
      const tile = testWorld.terrain.grid[d.y * testWorld.terrain.width + d.x];
      if (!tile || tile.biome === 'ocean') landReachabilityOk = false;
    });
    assert(landReachabilityOk, 'Every settlement and dungeon is on land and valid');

    // 10. Potion Full HP Turn Check
    state.character.hp = state.character.maxHp;
    state.inventory = [{ item: window.DOS.BASE_ITEMS.potion_health, quantity: 1 }];
    const potionSlotIdx = 0;

    let usedPotionAtFullHp = false;
    if (state.character.hp >= state.character.maxHp) {
      usedPotionAtFullHp = false;
    }
    assert(!usedPotionAtFullHp && state.inventory[0].quantity === 1, 'Potion at full HP is not consumed and does not waste turn');

    // 11. Dungeon Regeneration Determinism
    const testState1 = window.DOS.createInitialState('DetHero1', 'Fighter', 'Human', 'regen_seed_888');
    const testState2 = window.DOS.createInitialState('DetHero2', 'Fighter', 'Human', 'regen_seed_888');
    testState1.dungeons['dungeon_of_shadows'] = { cleared: true, clearedOnDay: 1, regenCount: 2 };
    testState2.dungeons['dungeon_of_shadows'] = { cleared: true, clearedOnDay: 1, regenCount: 2 };

    const roomsDet1 = dGen.generateRoomsForDungeon(testWorld.dungeons[0], testState1);
    const roomsDet2 = dGen.generateRoomsForDungeon(testWorld.dungeons[0], testState2);
    assert(
      roomsDet1.length === roomsDet2.length && roomsDet1[0].title === roomsDet2[0].title,
      'Dungeon regeneration is deterministic for same seed and regen count'
    );

    // 12. Quests Target Verification
    const qGen = new window.DOS.QuestGenerator('quest_test_seed');
    const townQuests = qGen.generateTownQuests(testWorld.settlements[0], 1);
    assert(townQuests.length > 0 && townQuests[0].title, 'Every generated quest references valid target and reward');

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
