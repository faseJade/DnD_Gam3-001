/* Dungeon of Shadows - Monster Catalog & Generator */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  const MONSTER_CATALOG = {
    Goblin: {
      name: 'Goblin',
      desc: 'A skulking green-skinned creature wielding a rusty dagger.',
      maxHp: 14,
      attackBonus: 2,
      defense: 10,
      damageDice: '1d6+1',
      xpReward: 30,
      goldReward: 12
    },
    Skeleton: {
      name: 'Skeleton',
      desc: 'Animated bones rattling in the dark with an old iron shortsword.',
      maxHp: 20,
      attackBonus: 3,
      defense: 12,
      damageDice: '1d6+2',
      xpReward: 45,
      goldReward: 18
    },
    GiantSpider: {
      name: 'Giant Spider',
      desc: 'A massive chitinous arachnid dripping venomous slaver from its fangs.',
      maxHp: 28,
      attackBonus: 4,
      defense: 13,
      damageDice: '1d8+2',
      xpReward: 60,
      goldReward: 25
    },
    Orc: {
      name: 'Orc',
      desc: 'A brutal warrior clad in heavy leather, swinging a crude battleaxe.',
      maxHp: 38,
      attackBonus: 5,
      defense: 14,
      damageDice: '1d10+2',
      xpReward: 85,
      goldReward: 38
    },
    DarkKnight: {
      name: 'Dark Knight',
      desc: 'The lord of the Dungeon of Shadows, encased in abyssal plate armor.',
      maxHp: 75,
      attackBonus: 7,
      defense: 16,
      damageDice: '2d6+4',
      xpReward: 280,
      goldReward: 160,
      isBoss: true
    }
  };

  DOS.MONSTER_CATALOG = MONSTER_CATALOG;

})(window.DOS);
