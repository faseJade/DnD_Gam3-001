/* Dungeon of Shadows - Dice Engine */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  function rollDie(faces, rng = null) {
    faces = parseInt(faces, 10) || 6;
    if (faces < 1) faces = 1;
    if (rng && typeof rng.int === 'function') {
      return rng.int(1, faces);
    }
    return Math.floor(Math.random() * faces) + 1;
  }

  function rollDice(diceExpr, rng = null) {
    if (!diceExpr) return { total: 0, rolls: [], bonus: 0, expr: '0' };

    // Normalize e.g. "2d6+3" or "d20-1" or "8"
    const str = String(diceExpr).toLowerCase().replace(/\s+/g, '');
    let bonus = 0;
    let dicePart = str;

    if (str.includes('+')) {
      const parts = str.split('+');
      dicePart = parts[0];
      bonus = parseInt(parts[1], 10) || 0;
    } else if (str.includes('-') && !str.startsWith('-')) {
      const parts = str.split('-');
      dicePart = parts[0];
      bonus = -(parseInt(parts[1], 10) || 0);
    }

    if (!dicePart.includes('d')) {
      // Just a constant integer
      const val = parseInt(dicePart, 10) || 0;
      return { total: val + bonus, rolls: [], bonus: bonus, expr: String(diceExpr) };
    }

    let [numStr, facesStr] = dicePart.split('d');
    if (numStr === '') numStr = '1';
    const num = parseInt(numStr, 10) || 1;
    const faces = parseInt(facesStr, 10) || 6;

    const rolls = [];
    let sum = 0;
    for (let i = 0; i < num; i++) {
      const r = rollDie(faces, rng);
      rolls.push(r);
      sum += r;
    }

    const total = sum + bonus;
    return {
      total: total,
      rolls: rolls,
      bonus: bonus,
      faces: faces,
      num: num,
      expr: String(diceExpr)
    };
  }

  DOS.rollDie = rollDie;
  DOS.rollDice = rollDice;

})(window.DOS);
