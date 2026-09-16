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
