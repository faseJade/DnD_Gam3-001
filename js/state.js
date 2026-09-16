/* Dungeon of Shadows - Central State & Validation Engine */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  function clamp(val, min, max) {
    if (typeof val !== 'number' || isNaN(val)) val = min;
    return Math.max(min, Math.min(max, val));
  }

  function getStatModifier(statVal) {
    return Math.floor((clamp(statVal, 1, 99) - 10) / 2);
  }

  function validateCharacter(c) {
    if (!c || typeof c !== 'object') c = {};

    c.name = typeof c.name === 'string' && c.name.trim() ? c.name.trim().substring(0, 24) : 'Hero';

    // Class check
    if (!DOS.CLASSES[c.className]) {
      c.className = 'Fighter';
    }
    // Race check
    if (!DOS.RACES[c.raceName]) {
      c.raceName = 'Human';
    }

    c.level = clamp(c.level, 1, 100);
    c.xp = clamp(c.xp, 0, 10000000);
    c.gold = clamp(c.gold, 0, 10000000);
    c.monstersDefeated = clamp(c.monstersDefeated, 0, 1000000);

    if (!c.stats || typeof c.stats !== 'object') {
      c.stats = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
    }

    ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].forEach(st => {
      c.stats[st] = clamp(c.stats[st], 1, 99);
    });

    c.maxHp = clamp(c.maxHp, 5, 9999);
    c.hp = clamp(c.hp, 0, c.maxHp);

    return c;
  }

  function createInitialState(name, className, raceName, customSeed = null) {
    const cls = DOS.CLASSES[className] || DOS.CLASSES.Fighter;
    const race = DOS.RACES[raceName] || DOS.RACES.Human;

    const seedStr = customSeed && String(customSeed).trim() ? String(customSeed).trim() : String(Math.floor(Math.random() * 1000000000));

    const stats = {
      STR: cls.baseStats.STR + race.bonuses.STR,
      DEX: cls.baseStats.DEX + race.bonuses.DEX,
      CON: cls.baseStats.CON + race.bonuses.CON,
      INT: cls.baseStats.INT + race.bonuses.INT,
      WIS: cls.baseStats.WIS + race.bonuses.WIS,
      CHA: cls.baseStats.CHA + race.bonuses.CHA
    };

    const maxHp = cls.baseHp + Math.floor((stats.CON - 10) / 2);

    const character = validateCharacter({
      name: name,
      className: cls.name,
      raceName: race.name,
      level: 1,
      xp: 0,
      hp: maxHp,
      maxHp: maxHp,
      gold: 25,
      stats: stats,
      monstersDefeated: 0
    });

    return {
      version: 2,
      inGame: true,
      worldSeed: seedStr,
      date: { year: 1, season: 'Spring', day: 1, totalDays: 1 },
      playerPos: { x: 0, y: 0 }, // Updated on world generation
      activeLocationId: null,
      currentView: 'WORLD_MAP', // WORLD_MAP, TOWN, DUNGEON, COMBAT, GUILD, SHOP, QUESTS, SETTINGS
      character: character,
      equipment: {
        weapon: DOS.BASE_ITEMS.sword,
        shield: DOS.BASE_ITEMS.shield,
        helmet: null,
        chest: null,
        boots: null,
        ring: null,
        amulet: null
      },
      inventory: [
        { item: DOS.BASE_ITEMS.potion_health, quantity: 2 },
        { item: DOS.BASE_ITEMS.potion_greater, quantity: 1 },
        { item: DOS.BASE_ITEMS.wand, quantity: 1 }
      ],
      quests: {
        active: [],
        completed: [],
        failed: []
      },
      reputation: {
        global: 0,
        settlements: {},
        guilds: {}
      },
      dungeons: {}, // persistent dungeon state diffs
      worldEvents: [],
      combat: {
        active: false,
        isPlayerDefending: false,
        monster: null,
        statusEffects: { player: [], monster: [] }
      },
      fogOfWar: '', // Encoded bitset
      narrator: {
        enabled: false,
        provider: 'openai', // 'openai' or 'inbrowser'
        endpoint: 'http://localhost:11434/v1',
        model: 'llama3',
        apiKey: '',
        cache: {}
      },
      logs: []
    };
  }

  DOS.clamp = clamp;
  DOS.getStatModifier = getStatModifier;
  DOS.validateCharacter = validateCharacter;
  DOS.createInitialState = createInitialState;

})(window.DOS);
