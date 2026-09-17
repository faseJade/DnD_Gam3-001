/* Dungeon of Shadows - Main Bootstrap & UI Orchestrator */

(function () {
  'use strict';

  let state = null;
  let world = null;
  let mapSystem = null;
  let eventGen = null;
  let dungeonGen = null;

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  function addLog(text, type = 'info') {
    if (!state) return;
    const entry = { text: text, type: type, timestamp: new Date().toLocaleTimeString() };
    state.logs.push(entry);
    if (state.logs.length > 200) state.logs.shift();

    const logContainer = document.getElementById('combat-log');
    if (logContainer) {
      const div = document.createElement('div');
      div.className = `log-entry ${type}`;
      div.textContent = `[${entry.timestamp}] ${text}`;
      logContainer.appendChild(div);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val !== undefined && val !== null ? val : '';
  }

  function setBarWidth(id, pctStr) {
    const el = document.getElementById(id);
    if (el) el.style.width = pctStr;
  }

  function updateCreationPreview() {
    const classSelect = document.getElementById('char-class');
    const raceSelect = document.getElementById('char-race');
    const previewContainer = document.getElementById('creation-preview-stats');
    const descEl = document.getElementById('class-description');

    if (!classSelect || !raceSelect || !previewContainer) return;

    const cls = window.DOS.CLASSES[classSelect.value] || window.DOS.CLASSES.Fighter;
    const race = window.DOS.RACES[raceSelect.value] || window.DOS.RACES.Human;

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
      <div style="grid-column: span 3; margin-top: 4px; color: #701313;">Starting HP: ${hp} | Skill: ${cls.signatureSkill}</div>
    `;

    if (descEl) descEl.textContent = `${cls.desc} (${race.desc})`;
  }

  function render() {
    if (!state || !state.inGame) return;

    const c = state.character;
    const reqXp = c.level * 100 + (c.level - 1) * 50;

    // Character Sheet
    setText('display-char-name', c.name);
    setText('display-level', c.level);
    setText('display-race', c.raceName);
    setText('display-class', c.className);
    setText('display-date', window.DOS.TimeSystem.getDateString(state));

    setText('display-hp-text', `${c.hp} / ${c.maxHp}`);
    setBarWidth('display-hp-bar', `${Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100))}%`);

    setText('display-xp-text', `${c.xp} / ${reqXp}`);
    setBarWidth('display-xp-bar', `${Math.max(0, Math.min(100, (c.xp / reqXp) * 100))}%`);

    setText('display-attack', window.DOS.CombatSystem.calculatePlayerAttack(state));
    setText('display-defense', window.DOS.CombatSystem.calculatePlayerDefense(state));
    setText('display-gold', c.gold);

    setText('display-str', c.stats.STR);
    setText('display-dex', c.stats.DEX);
    setText('display-con', c.stats.CON);
    setText('display-int', c.stats.INT);
    setText('display-wis', c.stats.WIS);
    setText('display-cha', c.stats.CHA);

    // Check for Game Over or Victory Modals
    if (c.hp <= 0) {
      showGameOverModal();
    }

    // Map vs Dungeon Visibility
    const mapContainer = document.getElementById('world-map-container');
    const dungeonContainer = document.getElementById('dungeon-container');
    const nonCombatControls = document.getElementById('non-combat-controls');
    const combatControls = document.getElementById('combat-controls');

    if (state.currentView === 'WORLD_MAP') {
      mapContainer.classList.remove('hidden');
      dungeonContainer.classList.add('hidden');
      nonCombatControls.classList.add('hidden');
      combatControls.classList.add('hidden');

      // Update Fog & Render Canvas
      if (mapSystem && world) {
        mapSystem.updateFogOfWar(state, world.terrain);
        mapSystem.render(state, world);
      }

      // Tile info
      const tile = world.terrain.grid[state.playerPos.y * world.terrain.width + state.playerPos.x];
      const locInfo = document.getElementById('map-location-info');
      if (locInfo && tile) {
        let nameStr = tile.biome.toUpperCase();
        if (tile.locationId) {
          const s = world.settlements.find(s => s.id === tile.locationId);
          const d = world.dungeons.find(d => d.id === tile.locationId);
          if (s) nameStr = `${s.name} (${s.typeName})`;
          if (d) nameStr = `${d.name} [Danger: ${d.difficulty}/10]`;
        }
        locInfo.textContent = `Location: (${tile.x}, ${tile.y}) — ${nameStr}`;
      }
    } else if (state.currentView === 'DUNGEON') {
      mapContainer.classList.add('hidden');
      dungeonContainer.classList.remove('hidden');

      const dState = state.dungeon;
      if (dState && dState.rooms) {
        const room = dState.rooms[dState.currentRoom - 1] || dState.roomState || {};
        setText('room-title', room.title || 'Dungeon Chamber');
        setText('room-badge', `Room ${dState.currentRoom} / ${dState.totalRooms}`);
        setText('room-description', room.desc || 'A silent corridor echoing with ancient power.');

        const btnRoomAction = document.getElementById('btn-room-action');
        if (btnRoomAction) {
          if (dState.currentRoom >= dState.totalRooms && !state.combat.active) {
            btnRoomAction.textContent = 'Exit Dungeon';
          } else {
            btnRoomAction.textContent = 'Proceed to Next Room';
          }
        }
      }

      if (state.combat.active && state.combat.monster) {
        const m = state.combat.monster;
        document.getElementById('monster-box').classList.remove('hidden');
        setText('monster-name', m.name);
        setText('monster-hp-text', `HP: ${m.currentHp}/${m.maxHp}`);
        setText('monster-desc', m.desc);
        setBarWidth('monster-hp-bar', `${Math.max(0, Math.min(100, (m.currentHp / m.maxHp) * 100))}%`);

        combatControls.classList.remove('hidden');
        nonCombatControls.classList.add('hidden');
      } else {
        document.getElementById('monster-box').classList.add('hidden');
        combatControls.classList.add('hidden');
        nonCombatControls.classList.remove('hidden');
      }
    }

    // Equipment & Inventory Display
    const weaponBtn = document.getElementById('btn-unequip-weapon');
    const armorBtn = document.getElementById('btn-unequip-armor');

    if (state.equipment.weapon) {
      setText('equipped-weapon-name', state.equipment.weapon.name);
      if (weaponBtn) weaponBtn.classList.remove('hidden');
    } else {
      setText('equipped-weapon-name', 'None');
      if (weaponBtn) weaponBtn.classList.add('hidden');
    }

    if (state.equipment.shield) {
      setText('equipped-armor-name', state.equipment.shield.name);
      if (armorBtn) armorBtn.classList.remove('hidden');
    } else {
      setText('equipped-armor-name', 'None');
      if (armorBtn) armorBtn.classList.add('hidden');
    }

    renderInventory();
  }

  function renderInventory() {
    const listEl = document.getElementById('inventory-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!state.inventory || state.inventory.length === 0) {
      listEl.innerHTML = '<p class="preview-desc">Inventory is empty.</p>';
      return;
    }

    state.inventory.forEach((slot, idx) => {
      const item = slot.item;
      const row = document.createElement('div');
      row.className = 'inventory-item';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.marginBottom = '6px';

      let actionBtnHtml = '';
      if (item.type === 'potion') {
        actionBtnHtml = `<button class="btn btn-mini btn-use-item" data-index="${idx}">Use</button>`;
      } else if (item.type === 'weapon' || item.type === 'shield') {
        actionBtnHtml = `<button class="btn btn-mini btn-equip-item" data-index="${idx}">Equip</button>`;
      }

      row.innerHTML = `
        <div class="item-info">
          <span class="item-name" style="font-weight:bold;">${item.name} x${slot.quantity}</span>
          <div class="item-qty" style="font-size:0.85rem; color:#555;">${item.desc}</div>
        </div>
        <div>${actionBtnHtml}</div>
      `;

      listEl.appendChild(row);
    });

    // Attach event handlers for inventory item buttons
    listEl.querySelectorAll('.btn-use-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        useInventoryPotion(index);
      });
    });

    listEl.querySelectorAll('.btn-equip-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        equipInventoryItem(index);
      });
    });
  }

  function useInventoryPotion(slotIndex) {
    if (!state || !state.inventory[slotIndex]) return;
    const slot = state.inventory[slotIndex];
    const item = slot.item;

    if (item.type !== 'potion') return;

    if (state.character.hp >= state.character.maxHp) {
      addLog('You are already at full HP!', 'info');
      showToast('Already at full HP!');
      return;
    }

    const healAmt = item.healAmount || 15;
    const oldHp = state.character.hp;
    state.character.hp = Math.min(state.character.maxHp, state.character.hp + healAmt);
    const recovered = state.character.hp - oldHp;

    slot.quantity -= 1;
    if (slot.quantity <= 0) {
      state.inventory.splice(slotIndex, 1);
    }

    addLog(`Used ${item.name} and recovered ${recovered} HP!`, 'heal');
    render();
  }

  function equipInventoryItem(slotIndex) {
    if (!state || !state.inventory[slotIndex]) return;
    const slot = state.inventory[slotIndex];
    const item = slot.item;

    if (item.type === 'weapon') {
      if (state.equipment.weapon) {
        // Return old weapon to inventory
        const existingSlot = state.inventory.find(s => s.item.id === state.equipment.weapon.id);
        if (existingSlot) existingSlot.quantity += 1;
        else state.inventory.push({ item: state.equipment.weapon, quantity: 1 });
      }
      state.equipment.weapon = item;
      slot.quantity -= 1;
      if (slot.quantity <= 0) state.inventory.splice(slotIndex, 1);
      addLog(`Equipped weapon: ${item.name}!`, 'system');
    } else if (item.type === 'shield') {
      if (state.equipment.shield) {
        const existingSlot = state.inventory.find(s => s.item.id === state.equipment.shield.id);
        if (existingSlot) existingSlot.quantity += 1;
        else state.inventory.push({ item: state.equipment.shield, quantity: 1 });
      }
      state.equipment.shield = item;
      slot.quantity -= 1;
      if (slot.quantity <= 0) state.inventory.splice(slotIndex, 1);
      addLog(`Equipped armor/shield: ${item.name}!`, 'system');
    }

    render();
  }

  function showGameOverModal() {
    const modal = document.getElementById('gameover-modal');
    if (!modal) return;
    const statsList = document.getElementById('gameover-stats-list');
    if (statsList && state) {
      const c = state.character;
      statsList.innerHTML = `
        <li><strong>Name:</strong> ${c.name}</li>
        <li><strong>Class & Race:</strong> Level ${c.level} ${c.raceName} ${c.className}</li>
        <li><strong>Monsters Defeated:</strong> ${c.monstersDefeated}</li>
        <li><strong>Gold Earned:</strong> ${c.gold}</li>
      `;
    }
    modal.classList.remove('hidden');
  }

  function showVictoryModal() {
    const modal = document.getElementById('victory-modal');
    if (!modal) return;
    const statsList = document.getElementById('victory-stats-list');
    if (statsList && state) {
      const c = state.character;
      statsList.innerHTML = `
        <li><strong>Hero Name:</strong> ${c.name}</li>
        <li><strong>Level Reached:</strong> ${c.level} (${c.xp} XP)</li>
        <li><strong>Class & Race:</strong> ${c.raceName} ${c.className}</li>
        <li><strong>Monsters Defeated:</strong> ${c.monstersDefeated}</li>
        <li><strong>Total Gold accumulated:</strong> ${c.gold}</li>
      `;
    }
    modal.classList.remove('hidden');
  }

  function handleMovePlayer(dx, dy) {
    if (!state || state.currentView !== 'WORLD_MAP') return;

    const nx = state.playerPos.x + dx;
    const ny = state.playerPos.y + dy;

    if (nx < 0 || nx >= world.terrain.width || ny < 0 || ny >= world.terrain.height) return;

    const tile = world.terrain.grid[ny * world.terrain.width + nx];
    if (!tile.biome || tile.biome === 'ocean') {
      showToast('Cannot cross deep ocean waters!');
      return;
    }

    state.playerPos.x = nx;
    state.playerPos.y = ny;

    // Advance time on movement
    window.DOS.TimeSystem.advanceTime(state, 1);

    // Travel Random Event
    if (eventGen) {
      const ev = eventGen.checkTravelEvent(state, tile);
      if (ev) {
        addLog(`EVENT: ${ev.title} — ${ev.desc}`, 'system');
        const checkRes = eventGen.performSkillCheck(state, ev.checkSkill, ev.dc);
        addLog(checkRes.logText, checkRes.isSuccess ? 'heal' : 'enemy-hit');

        if (checkRes.isSuccess && ev.rewardGold) {
          state.character.gold += ev.rewardGold;
          addLog(`Gained +${ev.rewardGold} Gold!`, 'loot');
        } else if (!checkRes.isSuccess && ev.triggerMonster) {
          const monsterTpl = window.DOS.MONSTER_CATALOG[ev.triggerMonster];
          if (monsterTpl) {
            state.currentView = 'DUNGEON';
            state.combat.active = true;
            state.combat.monster = JSON.parse(JSON.stringify(monsterTpl));
            state.combat.monster.currentHp = state.combat.monster.maxHp;
            addLog(`Combat engaged with ${state.combat.monster.name}!`, 'enemy-crit');
          }
        }
      }
    }

    // Check if stepped on a location
    if (tile.locationId) {
      const s = world.settlements.find(s => s.id === tile.locationId);
      const d = world.dungeons.find(d => d.id === tile.locationId);
      if (s) {
        addLog(`Arrived at ${s.name} (${s.typeName}). Rested and healed fully!`, 'heal');
        state.character.hp = state.character.maxHp;
      } else if (d) {
        addLog(`Entered ${d.name} [Difficulty ${d.difficulty}/10].`, 'system');
        state.currentView = 'DUNGEON';
        // Generate rooms
        const rooms = dungeonGen.generateRoomsForDungeon(d, state);
        state.dungeon = {
          currentRoom: 1,
          totalRooms: d.totalRooms,
          rooms: rooms,
          roomState: rooms[0]
        };
        if (rooms[0].type === 'monster' && rooms[0].monster) {
          state.combat.active = true;
          state.combat.monster = JSON.parse(JSON.stringify(rooms[0].monster));
          state.combat.monster.currentHp = state.combat.monster.maxHp;
        }
      }
    }

    render();
  }

  function initEvents() {
    document.getElementById('char-class').addEventListener('change', updateCreationPreview);
    document.getElementById('char-race').addEventListener('change', updateCreationPreview);

    document.getElementById('btn-start-adventure').addEventListener('click', () => {
      const nameInput = document.getElementById('char-name');
      const seedInput = document.getElementById('world-seed');
      const heroName = nameInput ? nameInput.value : 'Hero';
      const customSeed = seedInput ? seedInput.value : null;

      const className = document.getElementById('char-class').value;
      const raceName = document.getElementById('char-race').value;

      state = window.DOS.createInitialState(heroName, className, raceName, customSeed);

      // Generate World
      const worldGen = new window.DOS.WorldGenerator(state.worldSeed);
      world = worldGen.generate();
      eventGen = new window.DOS.EventGenerator(state.worldSeed);
      dungeonGen = new window.DOS.DungeonGenerator(state.worldSeed);

      // Add dungeons to world
      world.dungeons = dungeonGen.generateWorldDungeons(world.terrain, world.settlements);

      state.playerPos = { x: world.startingPos.x, y: world.startingPos.y };

      const canvas = document.getElementById('world-map-canvas');
      mapSystem = new window.DOS.MapSystem(canvas);

      document.getElementById('creation-view').classList.add('hidden');
      document.getElementById('game-view').classList.remove('hidden');
      const navBar = document.getElementById('view-nav-bar');
      if (navBar) {
        navBar.classList.remove('hidden');
        navBar.style.display = 'flex';
      }

      addLog(`Welcome to the world of Dungeon of Shadows, ${state.character.name}!`, 'system');
      addLog(`World Seed: ${state.worldSeed}`, 'system');

      window.DOS.DebugSystem.init(state, render);

      render();
    });

    // WASD / Arrow Key movement
    window.addEventListener('keydown', (e) => {
      if (!state || state.currentView !== 'WORLD_MAP') return;
      if (['ArrowUp', 'KeyW'].includes(e.code)) handleMovePlayer(0, -1);
      if (['ArrowDown', 'KeyS'].includes(e.code)) handleMovePlayer(0, 1);
      if (['ArrowLeft', 'KeyA'].includes(e.code)) handleMovePlayer(-1, 0);
      if (['ArrowRight', 'KeyD'].includes(e.code)) handleMovePlayer(1, 0);
    });

    // Navigation buttons
    document.getElementById('nav-btn-world').addEventListener('click', () => {
      if (state) { state.currentView = 'WORLD_MAP'; render(); }
    });
    document.getElementById('nav-btn-dungeon').addEventListener('click', () => {
      if (state) { state.currentView = 'DUNGEON'; render(); }
    });

    // Dungeon room progression button
    document.getElementById('btn-room-action').addEventListener('click', () => {
      if (!state || state.currentView !== 'DUNGEON') return;
      if (state.combat.active) return;

      const dState = state.dungeon;
      if (!dState || !dState.rooms) {
        state.currentView = 'WORLD_MAP';
        render();
        return;
      }

      if (dState.currentRoom >= dState.totalRooms) {
        addLog('Leaving dungeon and returning to world map.', 'system');
        state.currentView = 'WORLD_MAP';
        render();
        return;
      }

      dState.currentRoom += 1;
      const room = dState.rooms[dState.currentRoom - 1];
      dState.roomState = room;

      addLog(`Advanced to Room ${dState.currentRoom}: ${room.title}`, 'system');

      if (room.type === 'monster' && room.monster) {
        state.combat.active = true;
        state.combat.monster = JSON.parse(JSON.stringify(room.monster));
        state.combat.monster.currentHp = state.combat.monster.maxHp;
        addLog(`Encountered ${room.monster.name}! ${room.monster.desc}`, 'enemy-crit');
      } else if (room.type === 'treasure') {
        const goldVal = room.gold || (15 + window.DOS.rollDie(20));
        state.character.gold += goldVal;
        addLog(`Treasure found! Claimed ${goldVal} Gold!`, 'loot');
      } else if (room.type === 'trap') {
        const trapDmg = room.damage || (3 + window.DOS.rollDie(6));
        state.character.hp = Math.max(0, state.character.hp - trapDmg);
        addLog(`TRAP TRIGGERED! You take ${trapDmg} damage!`, 'enemy-hit');
      } else if (room.type === 'healing') {
        const oldHp = state.character.hp;
        state.character.hp = state.character.maxHp;
        addLog(`Healing Shrine! HP restored from ${oldHp} to ${state.character.maxHp}!`, 'heal');
      }

      render();
    });

    // Combat buttons
    document.getElementById('btn-attack').addEventListener('click', () => {
      window.DOS.CombatSystem.playerAttack(state, addLog);
      render();
    });
    document.getElementById('btn-skill').addEventListener('click', () => {
      window.DOS.CombatSystem.playerSkill(state, addLog);
      render();
    });
    document.getElementById('btn-defend').addEventListener('click', () => {
      if (!state || !state.combat.active) return;
      state.combat.isPlayerDefending = true;
      addLog('You take a defensive posture (+4 Defense until next turn).', 'system');
      window.DOS.CombatSystem.executeEnemyTurn(state, addLog);
      render();
    });
    document.getElementById('btn-combat-potion').addEventListener('click', () => {
      if (!state || !state.combat.active) return;
      const potIdx = state.inventory.findIndex(s => s.item.type === 'potion');
      if (potIdx < 0) {
        addLog('No health potions available in inventory!', 'miss');
        showToast('No potions available!');
        return;
      }
      useInventoryPotion(potIdx);
      window.DOS.CombatSystem.executeEnemyTurn(state, addLog);
      render();
    });
    document.getElementById('btn-run').addEventListener('click', () => {
      if (!state || !state.combat.active) return;
      if (state.combat.monster && state.combat.monster.isBoss) {
        addLog('You cannot run from a final boss!', 'enemy-crit');
        showToast('Cannot run from boss!');
        return;
      }
      const runRoll = window.DOS.rollDie(20);
      if (runRoll >= 10) {
        addLog(`Escape attempt successful (Rolled ${runRoll} >= 10)! Fled from battle.`, 'heal');
        state.combat.active = false;
        state.combat.monster = null;
      } else {
        addLog(`Escape failed (Rolled ${runRoll} < 10)! Enemy attacks!`, 'enemy-hit');
        window.DOS.CombatSystem.executeEnemyTurn(state, addLog);
      }
      render();
    });

    // Equipment Unequip Buttons
    document.getElementById('btn-unequip-weapon').addEventListener('click', () => {
      if (!state || !state.equipment.weapon) return;
      const wp = state.equipment.weapon;
      const existingSlot = state.inventory.find(s => s.item.id === wp.id);
      if (existingSlot) existingSlot.quantity += 1;
      else state.inventory.push({ item: wp, quantity: 1 });
      state.equipment.weapon = null;
      addLog(`Unequipped weapon: ${wp.name}`, 'system');
      render();
    });

    document.getElementById('btn-unequip-armor').addEventListener('click', () => {
      if (!state || !state.equipment.shield) return;
      const sh = state.equipment.shield;
      const existingSlot = state.inventory.find(s => s.item.id === sh.id);
      if (existingSlot) existingSlot.quantity += 1;
      else state.inventory.push({ item: sh, quantity: 1 });
      state.equipment.shield = null;
      addLog(`Unequipped armor: ${sh.name}`, 'system');
      render();
    });

    // Log Clear & New Game Buttons
    document.getElementById('btn-clear-log').addEventListener('click', () => {
      const logContainer = document.getElementById('combat-log');
      if (logContainer) logContainer.innerHTML = '';
      if (state) state.logs = [];
    });

    document.getElementById('btn-new-game').addEventListener('click', () => {
      if (confirm('Start a new game? Any unsaved progress will be lost.')) {
        state = null;
        document.getElementById('game-view').classList.add('hidden');
        document.getElementById('view-nav-bar').classList.add('hidden');
        document.getElementById('creation-view').classList.remove('hidden');
        document.getElementById('gameover-modal').classList.add('hidden');
        document.getElementById('victory-modal').classList.add('hidden');
      }
    });

    // Modal Buttons
    document.getElementById('btn-victory-continue').addEventListener('click', () => {
      document.getElementById('victory-modal').classList.add('hidden');
      if (state) { state.currentView = 'WORLD_MAP'; render(); }
    });
    document.getElementById('btn-victory-restart').addEventListener('click', () => {
      document.getElementById('victory-modal').classList.add('hidden');
      state = null;
      document.getElementById('game-view').classList.add('hidden');
      document.getElementById('view-nav-bar').classList.add('hidden');
      document.getElementById('creation-view').classList.remove('hidden');
    });
    document.getElementById('btn-gameover-restart').addEventListener('click', () => {
      document.getElementById('gameover-modal').classList.add('hidden');
      state = null;
      document.getElementById('game-view').classList.add('hidden');
      document.getElementById('view-nav-bar').classList.add('hidden');
      document.getElementById('creation-view').classList.remove('hidden');
    });

    // Header buttons
    document.getElementById('btn-save-game').addEventListener('click', () => {
      if (window.DOS.saveGame(state)) showToast('Game saved!');
    });
    document.getElementById('btn-load-game').addEventListener('click', () => {
      const loaded = window.DOS.loadGame();
      if (loaded) {
        state = loaded;
        const worldGen = new window.DOS.WorldGenerator(state.worldSeed);
        world = worldGen.generate();
        dungeonGen = new window.DOS.DungeonGenerator(state.worldSeed);
        world.dungeons = dungeonGen.generateWorldDungeons(world.terrain, world.settlements);

        mapSystem = new window.DOS.MapSystem(document.getElementById('world-map-canvas'));
        document.getElementById('creation-view').classList.add('hidden');
        document.getElementById('game-view').classList.remove('hidden');
        document.getElementById('view-nav-bar').classList.remove('hidden');
        showToast('Game loaded!');
        render();
      } else {
        showToast('No valid save found.');
      }
    });

    updateCreationPreview();
  }

  document.addEventListener('DOMContentLoaded', initEvents);

})();
