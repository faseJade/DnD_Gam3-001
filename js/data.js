/* Dungeon of Shadows - Static Data Catalog */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  // 6 Expanded Classes
  const CLASSES = {
    Fighter: {
      name: 'Fighter',
      baseStats: { STR: 14, DEX: 12, CON: 14, INT: 10, WIS: 10, CHA: 10 },
      baseHp: 26,
      hpPerLevel: 10,
      primaryStat: 'STR',
      signatureSkill: 'Power Strike',
      signatureSkillDesc: 'Deals 1.8x weapon damage with +2 attack bonus.',
      desc: 'Master of martial combat, relying on raw strength and thick armor.'
    },
    Wizard: {
      name: 'Wizard',
      baseStats: { STR: 8, DEX: 12, CON: 10, INT: 16, WIS: 14, CHA: 10 },
      baseHp: 16,
      hpPerLevel: 6,
      primaryStat: 'INT',
      signatureSkill: 'Fireball',
      signatureSkillDesc: 'Launches a flame blast dealing heavy magic damage.',
      desc: 'Scholarly spellcaster weaving arcane forces to decimate enemies.'
    },
    Rogue: {
      name: 'Rogue',
      baseStats: { STR: 10, DEX: 16, CON: 12, INT: 10, WIS: 10, CHA: 14 },
      baseHp: 20,
      hpPerLevel: 8,
      primaryStat: 'DEX',
      signatureSkill: 'Backstab',
      signatureSkillDesc: 'Strikes weak points with high critical hit chance.',
      desc: 'Agile trickster specializing in swift strikes and elusive defense.'
    },
    Cleric: {
      name: 'Cleric',
      baseStats: { STR: 12, DEX: 10, CON: 14, INT: 10, WIS: 16, CHA: 12 },
      baseHp: 22,
      hpPerLevel: 8,
      primaryStat: 'WIS',
      signatureSkill: 'Divine Light',
      signatureSkillDesc: 'Smites enemy while healing hero for 30% damage dealt.',
      desc: 'Devout holy warrior wielding divine magic and sturdy maces.'
    },
    Ranger: {
      name: 'Ranger',
      baseStats: { STR: 12, DEX: 15, CON: 12, INT: 10, WIS: 14, CHA: 10 },
      baseHp: 22,
      hpPerLevel: 8,
      primaryStat: 'DEX',
      signatureSkill: 'Precision Shot',
      signatureSkillDesc: 'Fires a deadly arrow bypassing 5 points of enemy defense.',
      desc: 'Master scout skilled in wilderness survival and ranged combat.'
    },
    Paladin: {
      name: 'Paladin',
      baseStats: { STR: 14, DEX: 10, CON: 15, INT: 8, WIS: 12, CHA: 14 },
      baseHp: 28,
      hpPerLevel: 10,
      primaryStat: 'STR',
      signatureSkill: 'Holy Smite',
      signatureSkillDesc: 'Infuses weapon with divine aura to crush dark foes.',
      desc: 'Armored champion bound by sacred oaths of justice.'
    }
  };

  // 6 Expanded Races
  const RACES = {
    Human: {
      name: 'Human',
      bonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
      desc: 'Versatile and adaptable, gaining +1 to all ability scores.'
    },
    Elf: {
      name: 'Elf',
      bonuses: { STR: 0, DEX: 2, CON: 0, INT: 1, WIS: 1, CHA: 0 },
      desc: 'Graceful and keen-minded, gaining +2 DEX, +1 INT, +1 WIS.'
    },
    Dwarf: {
      name: 'Dwarf',
      bonuses: { STR: 1, DEX: 0, CON: 2, INT: 0, WIS: 1, CHA: 0 },
      desc: 'Hardy and strong, gaining +2 CON, +1 STR, +1 WIS.'
    },
    Halfling: {
      name: 'Halfling',
      bonuses: { STR: 0, DEX: 2, CON: 1, INT: 0, WIS: 0, CHA: 1 },
      desc: 'Nimble and lucky, gaining +2 DEX, +1 CON, +1 CHA.'
    },
    Orc: {
      name: 'Orc',
      bonuses: { STR: 2, DEX: 0, CON: 2, INT: -1, WIS: 0, CHA: -1 },
      desc: 'Fierce and imposing, gaining +2 STR and +2 CON.'
    },
    Ignan: {
      name: 'Ignan',
      bonuses: { STR: 0, DEX: 1, CON: 0, INT: 2, WIS: 0, CHA: 1 },
      desc: 'Fiery lineage infused with ember spark, gaining +2 INT, +1 DEX, +1 CHA.'
    }
  };

  // Standard Item Base Catalog
  const BASE_ITEMS = {
    potion_health: {
      id: 'potion_health',
      name: 'Health Potion',
      type: 'potion',
      rarity: 'Common',
      healAmount: 20,
      value: 15,
      desc: 'Restores 20 HP when consumed.'
    },
    potion_greater: {
      id: 'potion_greater',
      name: 'Greater Health Potion',
      type: 'potion',
      rarity: 'Uncommon',
      healAmount: 45,
      value: 40,
      desc: 'Restores 45 HP when consumed.'
    },
    sword: {
      id: 'sword',
      name: 'Iron Longsword',
      type: 'weapon',
      rarity: 'Common',
      reqLevel: 1,
      attackBonus: 3,
      damageDice: '1d8',
      value: 25,
      desc: 'A sturdy iron longsword (+3 Attack).'
    },
    wand: {
      id: 'wand',
      name: 'Apprentice Wand',
      type: 'weapon',
      rarity: 'Common',
      reqLevel: 1,
      attackBonus: 3,
      damageDice: '1d6+1',
      value: 25,
      desc: 'A polished wand emitting faint sparks (+3 Attack).'
    },
    shield: {
      id: 'shield',
      name: 'Wooden Shield',
      type: 'shield',
      rarity: 'Common',
      reqLevel: 1,
      defenseBonus: 3,
      value: 20,
      desc: 'A heavy wooden shield reinforced with iron (+3 Defense).'
    }
  };

  DOS.CLASSES = CLASSES;
  DOS.RACES = RACES;
  DOS.BASE_ITEMS = BASE_ITEMS;

})(window.DOS);
