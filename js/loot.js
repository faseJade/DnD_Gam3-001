/* Dungeon of Shadows - Loot & Equipment Generator */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  class LootGenerator {
    static generateLoot(level = 1, rng = null) {
      const items = [
        DOS.BASE_ITEMS.potion_health,
        DOS.BASE_ITEMS.potion_greater,
        DOS.BASE_ITEMS.sword,
        DOS.BASE_ITEMS.wand,
        DOS.BASE_ITEMS.shield
      ];

      if (rng && typeof rng.pick === 'function') {
        return rng.pick(items);
      }
      return items[Math.floor(Math.random() * items.length)];
    }
  }

  DOS.LootGenerator = LootGenerator;

})(window.DOS);
