/* Dungeon of Shadows - Game Script */

(function () {
  'use strict';

  // --- SAVE STORAGE KEY ---
  const SAVE_KEY = 'dungeon_of_shadows_save';

  // --- DICE SYSTEM ---
  function rollDie(faces) {
    if (!faces || faces < 1) return 1;
    return Math.floor(Math.random() * faces) + 1;
  }

  function rollDiceNotation(diceString) {
    // e.g. "1d6+2" or "1d8"
    if (!diceString) return { total: 0, rolls: [], bonus: 0 };
    const parts = diceString.toLowerCase().split('+');
    const dicePart = parts[0].trim(); // "1d6"
    const bonus = parts[1] ? parseInt(parts[1].trim(), 10) || 0 : 0;

    const [numStr, facesStr] = dicePart.split('d');
    const num = parseInt(numStr, 10) || 1;
    const faces = parseInt(facesStr, 10) || 6;

    let rolls = [];
    let total = 0;
    for (let i = 0; i < num; i++) {
      const r = rollDie(faces);
      rolls.push(r);
      total += r;
    }
    total += bonus;
    return { total, rolls, bonus };
  }

  // --- CLASS & RACE DEFINITIONS ---
  const CLASSES = {
    Fighter: {
      name: 'Fighter',
      baseStats: { STR: 14, DEX: 12, CON: 14, INT: 10, WIS: 10, CHA: 10 },
      baseHp: 24,
      hpPerLevel: 10,
      primaryStat: 'STR',
      desc: 'Master of martial combat, relying on raw strength and thick armor.'
    },
    Wizard: {
      name: 'Wizard',
      baseStats: { STR: 8, DEX: 12, CON: 10, INT: 16, WIS: 14, CHA: 10 },
      baseHp: 16,
      hpPerLevel: 6,
      primaryStat: 'INT',
      desc: 'Scholarly spellcaster weaving arcane forces to decimate enemies.'
    },
    Rogue: {
      name: 'Rogue',
      baseStats: { STR: 10, DEX: 16, CON: 12, INT: 10, WIS: 10, CHA: 14 },
      baseHp: 20,
      hpPerLevel: 8,
      primaryStat: 'DEX',
      desc: 'Agile trickster specializing in swift strikes and elusive defense.'
    }
  };

  const RACES = {
    Human: {
      name: 'Human',
      bonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
      desc: 'Versatile and adaptable, gaining +1 to all ability scores.'
    },
    Elf: {
      name: 'Elf',
      bonuses: { STR: 0, DEX: 2, CON: 0, INT: 1, WIS: 0, CHA: 0 },
      desc: 'Graceful and keen-minded, gaining +2 DEX and +1 INT.'
    },
    Dwarf: {
      name: 'Dwarf',
      bonuses: { STR: 1, DEX: 0, CON: 2, INT: 0, WIS: 0, CHA: 0 },
      desc: 'Hardy and strong, gaining +2 CON and +1 STR.'
    }
  };

  // --- MONSTER CATALOG ---
  const MONSTER_CATALOG = {
    Goblin: {
      name: 'Goblin',
      desc: 'A skulking green-skinned creature wielding a rusty dagger.',
      maxHp: 12,
      attackBonus: 2,
      defense: 10,
      damageDice: '1d6+1',
      xpReward: 30,
      goldReward: 12
    },
    Skeleton: {
      name: 'Skeleton',
      desc: 'Animated bones rattling in the dark with an old iron shortsword.',
      maxHp: 18,
      attackBonus: 3,
      defense: 12,
      damageDice: '1d6+2',
      xpReward: 45,
      goldReward: 18
    },
    GiantSpider: {
      name: 'Giant Spider',
      desc: 'A massive chitinous arachnid dripping venomous slaver from its fangs.',
      maxHp: 24,
      attackBonus: 4,
      defense: 13,
      damageDice: '1d8+2',
      xpReward: 60,
      goldReward: 25
    },
    Orc: {
      name: 'Orc',
      desc: 'A brutal warrior clad in heavy leather, swinging a crude battleaxe.',
      maxHp: 32,
      attackBonus: 5,
      defense: 14,
      damageDice: '1d10+2',
      xpReward: 80,
      goldReward: 35
    },
    DarkKnight: {
      name: 'Dark Knight',
      desc: 'The lord of the Dungeon of Shadows, encased in abyssal plate armor.',
      maxHp: 65,
      attackBonus: 7,
      defense: 16,
      damageDice: '2d6+4',
      xpReward: 250,
      goldReward: 150,
      isBoss: true
    }
  };

  // --- ITEM TEMPLATES ---
  const ITEMS = {
    potion_health: {
      id: 'potion_health',
      name: 'Health Potion',
      type: 'potion',
      healAmount: 18,
      desc: 'Restores 18 HP when consumed.'
    },
    potion_greater: {
      id: 'potion_greater',
      name: 'Greater Health Potion',
      type: 'potion',
      healAmount: 40,
      desc: 'Restores 40 HP when consumed.'
    },
    sword: {
      id: 'sword',
      name: 'Sword',
      type: 'weapon',
      attackBonus: 3,
      damageDice: '1d8',
      desc: 'A sturdy steel longsword. (+3 Attack)'
    },
    wand: {
      id: 'wand',
      name: 'Wand',
      type: 'weapon',
      attackBonus: 3,
      damageDice: '1d6+1',
      desc: 'A polished arcane wand emitting faint sparkles. (+3 Attack)'
    },
    shield: {
      id: 'shield',
      name: 'Shield',
      type: 'armor',
      defenseBonus: 3,
      desc: 'A heavy wooden shield reinforced with iron. (+3 Defense)'
    }
  };

  // --- GAME STATE ---
  let gameState = null;

  function createInitialGameState(name, className, raceName) {
    const cls = CLASSES[className] || CLASSES.Fighter;
    const race = RACES[raceName] || RACES.Human;

    const stats = {
      STR: cls.baseStats.STR + race.bonuses.STR,
      DEX: cls.baseStats.DEX + race.bonuses.DEX,
      CON: cls.baseStats.CON + race.bonuses.CON,
      INT: cls.baseStats.INT + race.bonuses.INT,
      WIS: cls.baseStats.WIS + race.bonuses.WIS,
      CHA: cls.baseStats.CHA + race.bonuses.CHA
    };

    const maxHp = cls.baseHp + Math.floor((stats.CON - 10) / 2);

    return {
      version: 1,
      inGame: true,
      character: {
        name: name.trim() || 'Hero',
        className: cls.name,
        raceName: race.name,
        level: 1,
        xp: 0,
        hp: maxHp,
        maxHp: maxHp,
        gold: 15,
        stats: stats,
        monstersDefeated: 0
      },
      equipment: {
        weapon: null, // item object or null
        armor: null   // item object or null
      },
      inventory: [
        { item: ITEMS.potion_health, quantity: 2 },
        { item: ITEMS.potion_greater, quantity: 1 },
        { item: ITEMS.sword, quantity: 1 },
        { item: ITEMS.shield, quantity: 1 },
        { item: ITEMS.wand, quantity: 1 }
      ],
      dungeon: {
        currentRoom: 1,
        totalRooms: 10,
        roomState: null, // { type: 'empty'|'treasure'|'trap'|'shrine'|'monster', monster: {...}, cleared: boolean }
      },
      combat: {
        active: false,
        isPlayerDefending: false,
        monster: null
      },
      logs: []
    };
  }

  // --- DERIVED STAT CALCULATIONS ---
  function getStatModifier(statVal) {
    return Math.floor((statVal - 10) / 2);
  }

  function calculatePlayerAttack(state) {
    if (!state || !state.character) return 0;
    const c = state.character;
    const cls = CLASSES[c.className] || CLASSES.Fighter;

    // Choose modifier based on class primary stat
    const statMod = getStatModifier(c.stats[cls.primaryStat] || 10);
    const weaponBonus = state.equipment.weapon ? (state.equipment.weapon.attackBonus || 0) : 0;

    return Math.max(0, statMod + weaponBonus);
  }

  function calculatePlayerDefense(state) {
    if (!state || !state.character) return 10;
    const c = state.character;
    const dexMod = getStatModifier(c.stats.DEX || 10);
    const armorBonus = state.equipment.armor ? (state.equipment.armor.defenseBonus || 0) : 0;
    const defendBonus = state.combat.isPlayerDefending ? 4 : 0;

    return Math.max(10, 10 + dexMod + armorBonus + defendBonus);
  }

  function getRequiredXpForLevel(level) {
    // Level 1 -> 100, Level 2 -> 250, Level 3 -> 450, Level 4 -> 700...
    return level * 100 + (level - 1) * 50;
  }

  // --- LOGGING ---
  function addLog(message, type = 'info') {
    if (!gameState) return;
    const entry = { text: message, type: type, timestamp: new Date().toLocaleTimeString() };
    gameState.logs.push(entry);

    // Keep log buffer reasonable (max 150 entries)
    if (gameState.logs.length > 150) {
      gameState.logs.shift();
    }

    renderLogEntry(entry);
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // --- ROOM GENERATION ---
  function generateRoomState(roomNumber) {
    if (roomNumber >= 10) {
      // Room 10 is always the Dark Knight Boss
      const bossData = JSON.parse(JSON.stringify(MONSTER_CATALOG.DarkKnight));
      bossData.currentHp = bossData.maxHp;
      return {
        type: 'monster',
        monster: bossData,
        cleared: false,
        title: 'Room 10: The Shadow Sanctum',
        desc: 'An ominous throne room swirled in crimson mist. At center stands the Dark Knight, brandishing an abyssal blade!'
      };
    }

    // Room titles and descriptions
    const roomTitles = [
      'Forgotten Corridor',
      'Whispering Crypt',
      'Sunken Antechamber',
      'Dusty Armory',
      'Echoing Cavern',
      'Gloomy Passageway',
      'Desolate Guardpost',
      'Subterranean Vault',
      'Obsidian Hall'
    ];

    const title = `Room ${roomNumber}: ${roomTitles[roomNumber - 1] || 'Dungeon Depth'}`;

    // Event probability:
    // Room 1 is guaranteed Monster or Empty/Treasure (let's make Room 1 a weak monster or empty)
    const rand = Math.random();
    let type = 'monster';
    let monsterKey = 'Goblin';

    if (roomNumber === 1) {
      type = rand < 0.7 ? 'monster' : 'treasure';
      monsterKey = 'Goblin';
    } else {
      if (rand < 0.55) {
        type = 'monster';
        // Pick monster based on room depth
        if (roomNumber <= 3) {
          monsterKey = Math.random() < 0.6 ? 'Goblin' : 'Skeleton';
        } else if (roomNumber <= 6) {
          const mRand = Math.random();
          monsterKey = mRand < 0.4 ? 'Skeleton' : (mRand < 0.7 ? 'GiantSpider' : 'Orc');
        } else {
          monsterKey = Math.random() < 0.5 ? 'GiantSpider' : 'Orc';
        }
      } else if (rand < 0.70) {
        type = 'treasure';
      } else if (rand < 0.85) {
        type = 'trap';
      } else if (rand < 0.95) {
        type = 'shrine';
      } else {
        type = 'empty';
      }
    }

    let monster = null;
    let desc = '';

    if (type === 'monster') {
      const template = MONSTER_CATALOG[monsterKey];
      monster = JSON.parse(JSON.stringify(template));
      monster.currentHp = monster.maxHp;
      desc = `You enter the room and encounter a hostile ${monster.name}!`;
    } else if (type === 'treasure') {
      desc = 'You find a dusty chest glittering with rewards in the corner of the room.';
    } else if (type === 'trap') {
      desc = 'As you step inside, a hidden tripwire springs a mechanical trap!';
    } else if (type === 'shrine') {
      desc = 'A glowing ancient altar rests here, emitting a warm, soothing light.';
    } else {
      desc = 'The room is silent and empty. Old cobwebs hang from the stone ceiling.';
    }

    return {
      type: type,
      monster: monster,
      cleared: false,
      title: title,
      desc: desc
    };
  }

  // --- COMBAT CONTROLLER ---
  function startCombat(monster) {
    gameState.combat.active = true;
    gameState.combat.isPlayerDefending = false;
    gameState.combat.monster = monster;
    addLog(`Encountered ${monster.name}! ${monster.desc}`, 'system');
    render();
  }

  function handlePlayerAttack() {
    if (!gameState || !gameState.combat.active || !gameState.combat.monster) return;

    const c = gameState.character;
    const monster = gameState.combat.monster;
    const attackBonus = calculatePlayerAttack(gameState);

    const d20Roll = rollDie(20);
    const totalAttack = d20Roll + attackBonus;

    let isCrit = d20Roll === 20;
    let isCritMiss = d20Roll === 1;
    let damage = 0;

    if (isCritMiss) {
      addLog(`You roll ${d20Roll} + ${attackBonus} = ${totalAttack}. Critical miss! Your attack completely whiffs.`, 'miss');
    } else if (isCrit) {
      // Weapon damage or base d6
      let weaponDice = gameState.equipment.weapon ? gameState.equipment.weapon.damageDice : '1d6';
      const diceRes = rollDiceNotation(weaponDice);
      const strMod = getStatModifier(c.stats.STR);
      // Crit damage = max possible dice + roll + bonus
      const maxDiceVal = parseInt(weaponDice.split('d')[1] || '6', 10);
      damage = maxDiceVal + diceRes.total + Math.max(0, strMod);

      monster.currentHp = Math.max(0, monster.currentHp - damage);
      addLog(`NATURAL 20! Critical Hit! You roll ${d20Roll} + ${attackBonus} = ${totalAttack}. You deal ${damage} massive damage!`, 'player-crit');
    } else if (totalAttack >= monster.defense) {
      let weaponDice = gameState.equipment.weapon ? gameState.equipment.weapon.damageDice : '1d6';
      const diceRes = rollDiceNotation(weaponDice);
      const strMod = getStatModifier(c.stats.STR);
      damage = Math.max(1, diceRes.total + strMod);

      monster.currentHp = Math.max(0, monster.currentHp - damage);
      addLog(`You roll ${d20Roll} + ${attackBonus} = ${totalAttack} vs Def ${monster.defense}. Hit! You deal ${damage} damage.`, 'player-hit');
    } else {
      addLog(`You roll ${d20Roll} + ${attackBonus} = ${totalAttack} vs Def ${monster.defense}. Miss!`, 'miss');
    }

    // Check monster death
    if (monster.currentHp <= 0) {
      handleMonsterDefeated(monster);
      return;
    }

    // Enemy turn
    executeEnemyTurn();
  }

  function handlePlayerDefend() {
    if (!gameState || !gameState.combat.active || !gameState.combat.monster) return;

    gameState.combat.isPlayerDefending = true;
    addLog(`You raise your defenses, bracing for the enemy's attack (+4 Defense).`, 'info');

    executeEnemyTurn();
  }

  function handlePlayerUsePotionInCombat() {
    if (!gameState || !gameState.combat.active || !gameState.combat.monster) return;

    const c = gameState.character;
    if (c.hp >= c.maxHp) {
      addLog(`You are already at full HP (${c.hp}/${c.maxHp})! Potion not consumed.`, 'system');
      return;
    }

    // Check available potion
    let potionItem = gameState.inventory.find(i => i.item.type === 'potion' && i.quantity > 0);
    if (!potionItem) {
      addLog(`You have no potions left in your inventory!`, 'system');
      return;
    }

    // Consume 1 potion
    const healAmt = potionItem.item.healAmount || 20;
    c.hp = Math.min(c.maxHp, c.hp + healAmt);
    potionItem.quantity -= 1;
    if (potionItem.quantity <= 0) {
      gameState.inventory = gameState.inventory.filter(i => i.quantity > 0);
    }

    addLog(`You drank a ${potionItem.item.name} and recovered ${healAmt} HP! (${c.hp}/${c.maxHp})`, 'heal');

    executeEnemyTurn();
  }

  function handlePlayerRun() {
    if (!gameState || !gameState.combat.active || !gameState.combat.monster) return;

    const monster = gameState.combat.monster;

    if (monster.isBoss || gameState.dungeon.currentRoom >= 10) {
      addLog(`You cannot run from the Dark Knight! You must fight!`, 'system');
      return;
    }

    const c = gameState.character;
    const dexMod = getStatModifier(c.stats.DEX);
    const d20Roll = rollDie(20);
    const escapeTotal = d20Roll + dexMod;
    const dc = 11;

    if (escapeTotal >= dc) {
      addLog(`You rolled ${d20Roll} + ${dexMod} = ${escapeTotal}. You successfully escaped from the ${monster.name}!`, 'heal');
      gameState.combat.active = false;
      gameState.combat.monster = null;
      gameState.dungeon.roomState.cleared = true;
      gameState.dungeon.roomState.desc = `You fled from the ${monster.name}. The way forward is open.`;
      render();
    } else {
      addLog(`You rolled ${d20Roll} + ${dexMod} = ${escapeTotal}. Escape attempt failed!`, 'miss');
      executeEnemyTurn();
    }
  }

  function executeEnemyTurn() {
    if (!gameState || !gameState.combat.active || !gameState.combat.monster) return;

    const monster = gameState.combat.monster;
    if (monster.currentHp <= 0) return; // Dead monster doesn't attack

    const playerDef = calculatePlayerDefense(gameState);
    const d20Roll = rollDie(20);
    const totalEnemyAtk = d20Roll + monster.attackBonus;

    let isCrit = d20Roll === 20;
    let isCritMiss = d20Roll === 1;

    if (isCritMiss) {
      addLog(`${monster.name} rolled ${d20Roll} + ${monster.attackBonus} = ${totalEnemyAtk}. Critical miss!`, 'miss');
    } else if (isCrit) {
      const dmgRes = rollDiceNotation(monster.damageDice);
      const maxDiceVal = parseInt(monster.damageDice.split('d')[1] || '6', 10);
      const damage = maxDiceVal + dmgRes.total;

      gameState.character.hp = Math.max(0, gameState.character.hp - damage);
      addLog(`${monster.name} NATURAL 20! Critical Hit! ${monster.name} deals ${damage} damage to you!`, 'enemy-crit');
    } else if (totalEnemyAtk >= playerDef) {
      const dmgRes = rollDiceNotation(monster.damageDice);
      const damage = Math.max(1, dmgRes.total);

      gameState.character.hp = Math.max(0, gameState.character.hp - damage);
      addLog(`${monster.name} rolled ${d20Roll} + ${monster.attackBonus} = ${totalEnemyAtk} vs Def ${playerDef}. Hit! You take ${damage} damage.`, 'enemy-hit');
    } else {
      addLog(`${monster.name} rolled ${d20Roll} + ${monster.attackBonus} = ${totalEnemyAtk} vs Def ${playerDef}. Miss!`, 'miss');
    }

    // Reset defend state after enemy's turn
    gameState.combat.isPlayerDefending = false;

    // Check player death
    if (gameState.character.hp <= 0) {
      handlePlayerDefeated();
      return;
    }

    render();
  }

  function handleMonsterDefeated(monster) {
    addLog(`VICTORY! You defeated the ${monster.name}!`, 'player-crit');

    const c = gameState.character;
    c.monstersDefeated += 1;
    c.gold += monster.goldReward;
    addLog(`Earned ${monster.xpReward} XP and ${monster.goldReward} Gold!`, 'loot');

    gameState.combat.active = false;
    gameState.combat.monster = null;
    gameState.dungeon.roomState.cleared = true;

    // Award XP and check level up
    awardXp(monster.xpReward);

    if (monster.isBoss || gameState.dungeon.currentRoom >= 10) {
      handleGameVictory();
    } else {
      render();
    }
  }

  function awardXp(amount) {
    if (amount <= 0) return;
    const c = gameState.character;
    c.xp += amount;

    let requiredXp = getRequiredXpForLevel(c.level);
    let leveledUp = false;

    while (c.xp >= requiredXp) {
      c.level += 1;
      const cls = CLASSES[c.className] || CLASSES.Fighter;
      const hpInc = cls.hpPerLevel + getStatModifier(c.stats.CON);
      c.maxHp += hpInc;
      c.hp = c.maxHp; // Restore HP on level up

      // Boost primary stat and CON
      c.stats[cls.primaryStat] += 1;
      c.stats.CON += 1;

      addLog(`LEVEL UP! You are now Level ${c.level}! Max HP increased by +${hpInc}. HP fully restored!`, 'levelup');
      leveledUp = true;

      requiredXp = getRequiredXpForLevel(c.level);
    }

    if (leveledUp) {
      showToast(`Level Up! You reached Level ${c.level}!`);
    }
  }

  function handlePlayerDefeated() {
    addLog(`Your hero has fallen in battle...`, 'enemy-crit');
    gameState.combat.active = false;
    render();

    // Show Game Over Modal
    const modal = document.getElementById('gameover-modal');
    const statsList = document.getElementById('gameover-stats-list');
    if (modal && statsList) {
      const c = gameState.character;
      statsList.innerHTML = `
        <li><span>Name:</span> <strong>${escapeHtml(c.name)}</strong></li>
        <li><span>Class & Race:</span> <strong>${escapeHtml(c.raceName)} ${escapeHtml(c.className)}</strong></li>
        <li><span>Final Level:</span> <strong>${c.level}</strong></li>
        <li><span>Total XP:</span> <strong>${c.xp}</strong></li>
        <li><span>Gold Collected:</span> <strong>${c.gold}</strong></li>
        <li><span>Monsters Defeated:</span> <strong>${c.monstersDefeated}</strong></li>
        <li><span>Dungeon Reached:</span> <strong>Room ${gameState.dungeon.currentRoom} / 10</strong></li>
      `;
      modal.classList.remove('hidden');
    }
  }

  function handleGameVictory() {
    render();
    const modal = document.getElementById('victory-modal');
    const statsList = document.getElementById('victory-stats-list');
    if (modal && statsList) {
      const c = gameState.character;
      statsList.innerHTML = `
        <li><span>Name:</span> <strong>${escapeHtml(c.name)}</strong></li>
        <li><span>Class & Race:</span> <strong>${escapeHtml(c.raceName)} ${escapeHtml(c.className)}</strong></li>
        <li><span>Final Level:</span> <strong>${c.level}</strong></li>
        <li><span>Total XP:</span> <strong>${c.xp}</strong></li>
        <li><span>Gold Remaining:</span> <strong>${c.gold}</strong></li>
        <li><span>Monsters Defeated:</span> <strong>${c.monstersDefeated}</strong></li>
      `;
      modal.classList.remove('hidden');
    }
  }

  // --- ROOM CONTROLLER ---
  function proceedToNextRoom() {
    if (!gameState) return;

    // If room is not cleared, evaluate event
    const currentRoomState = gameState.dungeon.roomState;
    if (currentRoomState && !currentRoomState.cleared) {
      if (currentRoomState.type === 'monster') {
        startCombat(currentRoomState.monster);
        return;
      } else if (currentRoomState.type === 'treasure') {
        const goldGain = rollDie(20) + 10;
        gameState.character.gold += goldGain;
        addLog(`You open the chest and find ${goldGain} Gold!`, 'loot');

        // Chance for health potion
        if (Math.random() < 0.6) {
          addItemToInventory(ITEMS.potion_health, 1);
          addLog(`You also found a Health Potion!`, 'loot');
        }

        currentRoomState.cleared = true;
        render();
        return;
      } else if (currentRoomState.type === 'trap') {
        const trapDmg = rollDie(6) + 2;
        gameState.character.hp = Math.max(1, gameState.character.hp - trapDmg);
        addLog(`A poisonous dart hits you for ${trapDmg} damage! (HP: ${gameState.character.hp}/${gameState.character.maxHp})`, 'enemy-hit');

        currentRoomState.cleared = true;
        render();
        return;
      } else if (currentRoomState.type === 'shrine') {
        const healAmt = Math.floor(gameState.character.maxHp * 0.5);
        gameState.character.hp = Math.min(gameState.character.maxHp, gameState.character.hp + healAmt);
        addLog(`The holy shrine heals you for ${healAmt} HP!`, 'heal');

        currentRoomState.cleared = true;
        render();
        return;
      } else if (currentRoomState.type === 'empty') {
        addLog(`You search the empty room but find nothing of interest.`, 'info');
        currentRoomState.cleared = true;
        render();
        return;
      }
    }

    // Move to next room if cleared
    if (gameState.dungeon.currentRoom < gameState.dungeon.totalRooms) {
      gameState.dungeon.currentRoom += 1;
      gameState.dungeon.roomState = generateRoomState(gameState.dungeon.currentRoom);
      addLog(`Advanced to Room ${gameState.dungeon.currentRoom}.`, 'system');

      // Auto-trigger monster if room event is monster
      if (gameState.dungeon.roomState.type === 'monster') {
        startCombat(gameState.dungeon.roomState.monster);
      } else {
        render();
      }
    }
  }

  // --- INVENTORY MANAGEMENT ---
  function addItemToInventory(itemTemplate, qty = 1) {
    if (!gameState) return;
    const existing = gameState.inventory.find(i => i.item.id === itemTemplate.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      gameState.inventory.push({ item: itemTemplate, quantity: qty });
    }
  }

  function equipItem(itemId) {
    if (!gameState) return;
    const invSlot = gameState.inventory.find(i => i.item.id === itemId);
    if (!invSlot) return;

    const item = invSlot.item;
    if (item.type === 'weapon') {
      // Unequip current weapon if exists
      if (gameState.equipment.weapon) {
        addItemToInventory(gameState.equipment.weapon, 1);
      }
      gameState.equipment.weapon = item;
    } else if (item.type === 'armor') {
      if (gameState.equipment.armor) {
        addItemToInventory(gameState.equipment.armor, 1);
      }
      gameState.equipment.armor = item;
    } else {
      return; // Cannot equip non-equippable item
    }

    // Decrease item quantity in inventory
    invSlot.quantity -= 1;
    if (invSlot.quantity <= 0) {
      gameState.inventory = gameState.inventory.filter(i => i.quantity > 0);
    }

    addLog(`Equipped ${item.name}.`, 'system');
    render();
  }

  function unequipItem(slotType) {
    if (!gameState) return;
    if (slotType === 'weapon' && gameState.equipment.weapon) {
      addItemToInventory(gameState.equipment.weapon, 1);
      addLog(`Unequipped ${gameState.equipment.weapon.name}.`, 'system');
      gameState.equipment.weapon = null;
    } else if (slotType === 'armor' && gameState.equipment.armor) {
      addItemToInventory(gameState.equipment.armor, 1);
      addLog(`Unequipped ${gameState.equipment.armor.name}.`, 'system');
      gameState.equipment.armor = null;
    }
    render();
  }

  function useInventoryItem(itemId) {
    if (!gameState) return;
    const invSlot = gameState.inventory.find(i => i.item.id === itemId);
    if (!invSlot) return;

    const item = invSlot.item;

    if (item.type === 'potion') {
      const c = gameState.character;
      if (c.hp >= c.maxHp) {
        addLog(`You are already at full HP (${c.hp}/${c.maxHp})! Potion not consumed.`, 'system');
        return;
      }

      const healAmt = item.healAmount || 20;
      c.hp = Math.min(c.maxHp, c.hp + healAmt);
      invSlot.quantity -= 1;
      if (invSlot.quantity <= 0) {
        gameState.inventory = gameState.inventory.filter(i => i.quantity > 0);
      }

      addLog(`You drank ${item.name} and recovered ${healAmt} HP! (${c.hp}/${c.maxHp})`, 'heal');

      // If in combat, drinking potion from inventory triggers enemy turn
      if (gameState.combat.active && gameState.combat.monster) {
        executeEnemyTurn();
      } else {
        render();
      }
    } else if (item.type === 'weapon' || item.type === 'armor') {
      equipItem(itemId);
    }
  }

  // --- SAVE & LOAD SYSTEM ---
  function saveGame() {
    if (!gameState || !gameState.inGame) {
      showToast('No active game to save!');
      return;
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
      showToast('Game saved successfully!');
      addLog('Game saved to local storage.', 'system');
    } catch (err) {
      console.error(err);
      showToast('Error saving game!');
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        showToast('No saved game found.');
        addLog('No saved game found in local storage.', 'system');
        return;
      }

      const loadedState = JSON.parse(raw);

      // Validate save data structure
      if (!loadedState || !loadedState.character || !loadedState.character.name || typeof loadedState.character.hp !== 'number') {
        showToast('Save data is corrupted!');
        addLog('Corrupted save data detected.', 'system');
        return;
      }

      // Ensure stats and safe fallbacks
      loadedState.character.hp = Math.max(0, Math.min(loadedState.character.maxHp, loadedState.character.hp));
      loadedState.character.xp = Math.max(0, loadedState.character.xp || 0);
      loadedState.character.level = Math.max(1, loadedState.character.level || 1);
      loadedState.character.gold = Math.max(0, loadedState.character.gold || 0);

      gameState = loadedState;

      // Ensure roomState exists
      if (!gameState.dungeon.roomState) {
        gameState.dungeon.roomState = generateRoomState(gameState.dungeon.currentRoom);
      }

      // Switch views
      document.getElementById('creation-view').classList.add('hidden');
      document.getElementById('game-view').classList.remove('hidden');

      showToast('Game loaded successfully!');
      addLog('Save game loaded.', 'system');
      render();
    } catch (err) {
      console.error(err);
      showToast('Failed to load save data!');
    }
  }

  function startNewGame() {
    // Hide modals
    document.getElementById('victory-modal').classList.add('hidden');
    document.getElementById('gameover-modal').classList.add('hidden');

    // Switch to creation view
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('creation-view').classList.remove('hidden');

    updateCreationPreview();
  }

  // --- UI RENDERING ---
  function render() {
    if (!gameState || !gameState.inGame) return;

    const c = gameState.character;
    const reqXp = getRequiredXpForLevel(c.level);

    // Character Sheet
    setText('display-char-name', c.name);
    setText('display-level', c.level);
    setText('display-race', c.raceName);
    setText('display-class', c.className);

    setText('display-hp-text', `${c.hp} / ${c.maxHp}`);
    const hpPct = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
    setBarWidth('display-hp-bar', `${hpPct}%`);

    setText('display-xp-text', `${c.xp} / ${reqXp}`);
    const xpPct = Math.max(0, Math.min(100, (c.xp / reqXp) * 100));
    setBarWidth('display-xp-bar', `${xpPct}%`);

    setText('display-attack', calculatePlayerAttack(gameState));
    setText('display-defense', calculatePlayerDefense(gameState));
    setText('display-gold', c.gold);

    setText('display-str', c.stats.STR);
    setText('display-dex', c.stats.DEX);
    setText('display-con', c.stats.CON);
    setText('display-int', c.stats.INT);
    setText('display-wis', c.stats.WIS);
    setText('display-cha', c.stats.CHA);

    // Dungeon View
    const dungeon = gameState.dungeon;
    setText('room-badge', `Room ${dungeon.currentRoom} / ${dungeon.totalRooms}`);

    const rState = dungeon.roomState;
    if (rState) {
      setText('room-title', rState.title);
      setText('room-description', rState.desc);
    }

    // Monster & Combat Display
    const monsterBox = document.getElementById('monster-box');
    const combatControls = document.getElementById('combat-controls');
    const nonCombatControls = document.getElementById('non-combat-controls');
    const btnRoomAction = document.getElementById('btn-room-action');

    if (gameState.combat.active && gameState.combat.monster) {
      const m = gameState.combat.monster;
      monsterBox.classList.remove('hidden');
      setText('monster-name', m.name);
      setText('monster-hp-text', `HP: ${m.currentHp}/${m.maxHp}`);
      setText('monster-desc', m.desc);

      const mHpPct = Math.max(0, Math.min(100, (m.currentHp / m.maxHp) * 100));
      setBarWidth('monster-hp-bar', `${mHpPct}%`);

      combatControls.classList.remove('hidden');
      nonCombatControls.classList.add('hidden');

      // Disable Run button if boss
      const btnRun = document.getElementById('btn-run');
      if (btnRun) {
        btnRun.disabled = m.isBoss || dungeon.currentRoom >= 10;
      }
    } else {
      monsterBox.classList.add('hidden');
      combatControls.classList.add('hidden');
      nonCombatControls.classList.remove('hidden');

      if (rState) {
        if (!rState.cleared) {
          if (rState.type === 'monster') {
            btnRoomAction.textContent = 'Engage Monster';
          } else if (rState.type === 'treasure') {
            btnRoomAction.textContent = 'Open Treasure Chest';
          } else if (rState.type === 'trap') {
            btnRoomAction.textContent = 'Trigger Trap';
          } else if (rState.type === 'shrine') {
            btnRoomAction.textContent = 'Pray at Shrine';
          } else {
            btnRoomAction.textContent = 'Search Room';
          }
        } else {
          if (dungeon.currentRoom >= dungeon.totalRooms) {
            btnRoomAction.textContent = 'Dungeon Cleared!';
            btnRoomAction.disabled = true;
          } else {
            btnRoomAction.textContent = `Proceed to Room ${dungeon.currentRoom + 1}`;
            btnRoomAction.disabled = false;
          }
        }
      }
    }

    // Equipment Display
    const weaponName = gameState.equipment.weapon ? gameState.equipment.weapon.name : 'None';
    const armorName = gameState.equipment.armor ? gameState.equipment.armor.name : 'None';
    setText('equipped-weapon-name', weaponName);
    setText('equipped-armor-name', armorName);

    toggleVisibility('btn-unequip-weapon', !!gameState.equipment.weapon);
    toggleVisibility('btn-unequip-armor', !!gameState.equipment.armor);

    // Inventory List Display
    renderInventoryList();
  }

  function renderInventoryList() {
    const listEl = document.getElementById('inventory-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!gameState || !gameState.inventory || gameState.inventory.length === 0) {
      listEl.innerHTML = '<p class="preview-desc">Inventory is empty.</p>';
      return;
    }

    gameState.inventory.forEach(slot => {
      const item = slot.item;
      const row = document.createElement('div');
      row.className = 'inventory-item';

      let actionBtnHtml = '';
      if (item.type === 'potion') {
        actionBtnHtml = `<button class="btn btn-mini btn-potion-use" data-item-id="${item.id}">Use</button>`;
      } else if (item.type === 'weapon' || item.type === 'armor') {
        actionBtnHtml = `<button class="btn btn-mini btn-equip-item" data-item-id="${item.id}">Equip</button>`;
      }

      row.innerHTML = `
        <div class="item-info">
          <span class="item-name">${escapeHtml(item.name)}</span>
          <span class="item-qty">${item.desc} (Qty: ${slot.quantity})</span>
        </div>
        <div class="item-actions">
          ${actionBtnHtml}
        </div>
      `;
      listEl.appendChild(row);
    });

    // Attach event listeners to inventory buttons
    listEl.querySelectorAll('.btn-potion-use, .btn-equip-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.target.getAttribute('data-item-id');
        useInventoryItem(itemId);
      });
    });
  }

  function renderLogEntry(entry) {
    const logContainer = document.getElementById('combat-log');
    if (!logContainer) return;

    const div = document.createElement('div');
    div.className = `log-entry ${entry.type || 'info'}`;
    div.textContent = `[${entry.timestamp}] ${entry.text}`;
    logContainer.appendChild(div);

    // Auto-scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // --- CHARACTER CREATION PREVIEW ---
  function updateCreationPreview() {
    const nameInput = document.getElementById('char-name');
    const classSelect = document.getElementById('char-class');
    const raceSelect = document.getElementById('char-race');
    const previewContainer = document.getElementById('creation-preview-stats');
    const descEl = document.getElementById('class-description');

    if (!classSelect || !raceSelect || !previewContainer) return;

    const cls = CLASSES[classSelect.value] || CLASSES.Fighter;
    const race = RACES[raceSelect.value] || RACES.Human;

    const str = cls.baseStats.STR + race.bonuses.STR;
    const dex = cls.baseStats.DEX + race.bonuses.DEX;
    const con = cls.baseStats.CON + race.bonuses.CON;
    const int = cls.baseStats.INT + race.bonuses.INT;
    const wis = cls.baseStats.WIS + race.bonuses.WIS;
    const cha = cls.baseStats.CHA + race.bonuses.CHA;

    const hp = cls.baseHp + Math.floor((con - 10) / 2);

    previewContainer.innerHTML = `
      <div>STR: ${str}</div>
      <div>DEX: ${dex}</div>
      <div>CON: ${con}</div>
      <div>INT: ${int}</div>
      <div>WIS: ${wis}</div>
      <div>CHA: ${cha}</div>
      <div style="grid-column: span 3; margin-top: 4px; color: #701313;">Starting HP: ${hp}</div>
    `;

    if (descEl) {
      descEl.textContent = `${cls.desc} (${race.desc})`;
    }
  }

  // --- HELPER UTILITIES ---
  function setText(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = value !== undefined && value !== null ? value : '';
  }

  function setBarWidth(elementId, widthStr) {
    const el = document.getElementById(elementId);
    if (el) el.style.width = widthStr;
  }

  function toggleVisibility(elementId, show) {
    const el = document.getElementById(elementId);
    if (el) {
      if (show) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- EVENT ATTACHMENTS ---
  function initEvents() {
    // Character creation form inputs
    const charClassSelect = document.getElementById('char-class');
    const charRaceSelect = document.getElementById('char-race');
    if (charClassSelect) charClassSelect.addEventListener('change', updateCreationPreview);
    if (charRaceSelect) charRaceSelect.addEventListener('change', updateCreationPreview);

    // Enter Dungeon / Start Adventure button
    const btnStart = document.getElementById('btn-start-adventure');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        const nameInput = document.getElementById('char-name');
        const heroName = nameInput ? nameInput.value : 'Hero';

        if (!heroName.trim()) {
          showToast('Please enter a hero name!');
          nameInput.focus();
          return;
        }

        const className = charClassSelect ? charClassSelect.value : 'Fighter';
        const raceName = charRaceSelect ? charRaceSelect.value : 'Human';

        gameState = createInitialGameState(heroName, className, raceName);
        gameState.dungeon.roomState = generateRoomState(1);

        document.getElementById('creation-view').classList.add('hidden');
        document.getElementById('game-view').classList.remove('hidden');

        // Clear logs
        const logContainer = document.getElementById('combat-log');
        if (logContainer) logContainer.innerHTML = '';

        addLog(`Welcome to Dungeon of Shadows, ${gameState.character.name} the ${raceName} ${className}!`, 'system');

        // Auto-trigger Room 1 event if monster
        if (gameState.dungeon.roomState.type === 'monster') {
          startCombat(gameState.dungeon.roomState.monster);
        } else {
          render();
        }
      });
    }

    // Room Action button
    const btnRoomAction = document.getElementById('btn-room-action');
    if (btnRoomAction) {
      btnRoomAction.addEventListener('click', proceedToNextRoom);
    }

    // Combat buttons
    const btnAttack = document.getElementById('btn-attack');
    if (btnAttack) btnAttack.addEventListener('click', handlePlayerAttack);

    const btnDefend = document.getElementById('btn-defend');
    if (btnDefend) btnDefend.addEventListener('click', handlePlayerDefend);

    const btnCombatPotion = document.getElementById('btn-combat-potion');
    if (btnCombatPotion) btnCombatPotion.addEventListener('click', handlePlayerUsePotionInCombat);

    const btnRun = document.getElementById('btn-run');
    if (btnRun) btnRun.addEventListener('click', handlePlayerRun);

    // Unequip buttons
    const btnUnequipWeapon = document.getElementById('btn-unequip-weapon');
    if (btnUnequipWeapon) btnUnequipWeapon.addEventListener('click', () => unequipItem('weapon'));

    const btnUnequipArmor = document.getElementById('btn-unequip-armor');
    if (btnUnequipArmor) btnUnequipArmor.addEventListener('click', () => unequipItem('armor'));

    // Header buttons
    const btnSave = document.getElementById('btn-save-game');
    if (btnSave) btnSave.addEventListener('click', saveGame);

    const btnLoad = document.getElementById('btn-load-game');
    if (btnLoad) btnLoad.addEventListener('click', loadGame);

    const btnNewGame = document.getElementById('btn-new-game');
    if (btnNewGame) btnNewGame.addEventListener('click', startNewGame);

    // Clear log
    const btnClearLog = document.getElementById('btn-clear-log');
    if (btnClearLog) {
      btnClearLog.addEventListener('click', () => {
        const logContainer = document.getElementById('combat-log');
        if (logContainer) logContainer.innerHTML = '';
        if (gameState) gameState.logs = [];
      });
    }

    // Modal restart buttons
    const btnVictoryRestart = document.getElementById('btn-victory-restart');
    if (btnVictoryRestart) btnVictoryRestart.addEventListener('click', startNewGame);

    const btnGameOverRestart = document.getElementById('btn-gameover-restart');
    if (btnGameOverRestart) btnGameOverRestart.addEventListener('click', startNewGame);

    // Initial preview setup
    updateCreationPreview();
  }

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', initEvents);

})();
