/* Dungeon of Shadows - Combat State Machine System */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  const BIOME_DESCRIPTIONS = {
    plains: 'Tall grass sways around you on the open plains.',
    grass: 'Gentle grassy hills stretch toward the horizon.',
    forest: 'Ancient towering trees cast long, dark shadows around you.',
    swamp: 'Misty, foul-smelling waters pool beneath gnarly mangrove roots.',
    desert: 'Scorching sands shift underfoot beneath a blazing sun.',
    mountain: 'Jagged granite crags and cold mountain winds surround the rocky trail.',
    snow: 'Freezing drifts of snow blanket the barren landscape.',
    hills: 'Rolling wind-swept hills offer little cover from predators.',
    tundra: 'Frozen sub-zero tundra stretches out beneath grey skies.'
  };

  function startCombat(state, monsterKeyOrObj, context = 'dungeon', meta = {}) {
    if (!state) return;
    let monster = null;
    if (typeof monsterKeyOrObj === 'string') {
      const tpl = DOS.MONSTER_CATALOG[monsterKeyOrObj] || DOS.MONSTER_CATALOG.Goblin;
      monster = JSON.parse(JSON.stringify(tpl));
    } else if (monsterKeyOrObj && typeof monsterKeyOrObj === 'object') {
      monster = JSON.parse(JSON.stringify(monsterKeyOrObj));
    }

    if (!monster) return;
    if (typeof monster.currentHp !== 'number') monster.currentHp = monster.maxHp;

    if (!state.combat) {
      state.combat = { active: false, context: null, isPlayerDefending: false, monster: null, meta: {} };
    }

    state.combat.active = true;
    state.combat.context = context; // 'wilderness' | 'dungeon'
    state.combat.monster = monster;
    state.combat.isPlayerDefending = false;
    state.combat.meta = meta || {};
    state.currentView = 'DUNGEON';
  }

  function getCombatViewModel(state) {
    if (!state) {
      return {
        heading: 'Combat',
        title: 'Chamber',
        badge: '',
        description: 'No active combat.',
        showRoomBadge: false,
        primaryButton: 'Continue Journey'
      };
    }

    const cState = state.combat || {};
    const context = cState.context || (state.dungeon ? 'dungeon' : 'wilderness');

    if (context === 'wilderness') {
      const meta = cState.meta || {};
      const biome = meta.biome || 'wilderness';
      const eventTitle = meta.eventTitle || 'Wilderness Ambush!';
      const pos = meta.pos || state.playerPos || { x: 0, y: 0 };
      const biomeDesc = BIOME_DESCRIPTIONS[biome.toLowerCase()] || 'The wild untamed wilderness surrounds you.';

      return {
        heading: 'Wilderness Encounter',
        title: `Wilderness Encounter: ${eventTitle}`,
        badge: `${biome.charAt(0).toUpperCase() + biome.slice(1)} (${pos.x}, ${pos.y})`,
        description: biomeDesc,
        showRoomBadge: false,
        primaryButton: 'Continue Journey'
      };
    }

    // Dungeon Context
    const dState = state.dungeon || {};
    const dName = dState.name || 'Dungeon of Shadows';
    const currentRoom = dState.currentRoom || 1;
    const totalRooms = dState.totalRooms || 10;
    const rooms = dState.rooms || [];
    const room = rooms[currentRoom - 1] || dState.roomState || {};

    return {
      heading: dName,
      title: room.title || 'Dungeon Chamber',
      badge: `Room ${currentRoom} / ${totalRooms}`,
      description: room.desc || 'A dark subterranean corridor echoing with footsteps.',
      showRoomBadge: true,
      primaryButton: currentRoom >= totalRooms && (!cState.active) ? 'Exit Dungeon' : 'Proceed to Next Room'
    };
  }

  class CombatSystem {
    static calculatePlayerAttack(state) {
      if (!state || !state.character) return 0;
      const c = state.character;
      const cls = DOS.CLASSES[c.className] || DOS.CLASSES.Fighter;
      const statMod = DOS.getStatModifier(c.stats[cls.primaryStat] || 10);
      const weaponBonus = state.equipment.weapon ? (state.equipment.weapon.attackBonus || 0) : 0;
      return Math.max(0, statMod + weaponBonus);
    }

    static calculatePlayerDefense(state) {
      if (!state || !state.character) return 10;
      const c = state.character;
      const dexMod = DOS.getStatModifier(c.stats.DEX || 10);
      const shieldBonus = state.equipment.shield ? (state.equipment.shield.defenseBonus || 0) : 0;
      const defendBonus = state.combat.isPlayerDefending ? 4 : 0;
      return Math.max(10, 10 + dexMod + shieldBonus + defendBonus);
    }

    static playerAttack(state, logCallback) {
      if (!state || !state.combat.active || !state.combat.monster) return;

      const c = state.character;
      const monster = state.combat.monster;
      const attackBonus = this.calculatePlayerAttack(state);
      const d20 = DOS.rollDie(20);
      const totalAttack = d20 + attackBonus;

      const isCrit = d20 === 20;
      const isCritMiss = d20 === 1;

      if (isCritMiss) {
        logCallback(`You roll ${d20} + ${attackBonus} = ${totalAttack}. Critical miss! Your attack whiffs.`, 'miss');
      } else if (isCrit) {
        const diceRes = DOS.rollDice(state.equipment.weapon ? state.equipment.weapon.damageDice : '1d6');
        const strMod = DOS.getStatModifier(c.stats.STR);
        const damage = diceRes.total + 8 + Math.max(0, strMod);
        monster.currentHp = Math.max(0, monster.currentHp - damage);
        logCallback(`NATURAL 20! Critical Hit! You roll ${d20} + ${attackBonus} = ${totalAttack}. You deal ${damage} massive damage!`, 'player-crit');
      } else if (totalAttack >= monster.defense) {
        const diceRes = DOS.rollDice(state.equipment.weapon ? state.equipment.weapon.damageDice : '1d6');
        const strMod = DOS.getStatModifier(c.stats.STR);
        const damage = Math.max(1, diceRes.total + strMod);
        monster.currentHp = Math.max(0, monster.currentHp - damage);
        logCallback(`You roll ${d20} + ${attackBonus} = ${totalAttack} vs Def ${monster.defense}. Hit! You deal ${damage} damage.`, 'player-hit');
      } else {
        logCallback(`You roll ${d20} + ${attackBonus} = ${totalAttack} vs Def ${monster.defense}. Miss!`, 'miss');
      }

      if (monster.currentHp <= 0) {
        this.handleMonsterDefeated(state, monster, logCallback);
        return;
      }

      this.executeEnemyTurn(state, logCallback);
    }

    static playerSkill(state, logCallback) {
      if (!state || !state.combat.active || !state.combat.monster) return;

      const c = state.character;
      const cls = DOS.CLASSES[c.className] || DOS.CLASSES.Fighter;
      const monster = state.combat.monster;

      logCallback(`You perform ${cls.signatureSkill}! ${cls.signatureSkillDesc}`, 'player-crit');
      const baseAtk = this.calculatePlayerAttack(state);
      const damage = Math.max(5, baseAtk * 2 + DOS.rollDie(8));
      monster.currentHp = Math.max(0, monster.currentHp - damage);
      logCallback(`${cls.signatureSkill} strikes ${monster.name} for ${damage} damage!`, 'player-crit');

      if (monster.currentHp <= 0) {
        this.handleMonsterDefeated(state, monster, logCallback);
        return;
      }

      this.executeEnemyTurn(state, logCallback);
    }

    static executeEnemyTurn(state, logCallback) {
      if (!state || !state.combat.active || !state.combat.monster) return;

      const monster = state.combat.monster;
      if (monster.currentHp <= 0) return;

      const playerDef = this.calculatePlayerDefense(state);
      const d20 = DOS.rollDie(20);
      const totalEnemyAtk = d20 + monster.attackBonus;

      const isCrit = d20 === 20;
      const isCritMiss = d20 === 1;

      if (isCritMiss) {
        logCallback(`${monster.name} rolled ${d20} + ${monster.attackBonus} = ${totalEnemyAtk}. Critical miss!`, 'miss');
      } else if (isCrit) {
        const dmgRes = DOS.rollDice(monster.damageDice);
        const damage = dmgRes.total + 6;
        state.character.hp = Math.max(0, state.character.hp - damage);
        logCallback(`${monster.name} NATURAL 20! Critical Hit! Deals ${damage} damage to you!`, 'enemy-crit');
      } else if (totalEnemyAtk >= playerDef) {
        const dmgRes = DOS.rollDice(monster.damageDice);
        const damage = Math.max(1, dmgRes.total);
        state.character.hp = Math.max(0, state.character.hp - damage);
        logCallback(`${monster.name} rolled ${d20} + ${monster.attackBonus} = ${totalEnemyAtk} vs Def ${playerDef}. Hit! You take ${damage} damage.`, 'enemy-hit');
      } else {
        logCallback(`${monster.name} rolled ${d20} + ${monster.attackBonus} = ${totalEnemyAtk} vs Def ${playerDef}. Miss!`, 'miss');
      }

      state.combat.isPlayerDefending = false;

      if (state.character.hp <= 0) {
        state.combat.active = false;
        logCallback(`Your hero has fallen in battle...`, 'enemy-crit');
      }
    }

    static handleMonsterDefeated(state, monster, logCallback) {
      logCallback(`VICTORY! You defeated the ${monster.name}!`, 'player-crit');

      const c = state.character;
      c.monstersDefeated += 1;
      c.gold += monster.goldReward;
      logCallback(`Earned ${monster.xpReward} XP and ${monster.goldReward} Gold!`, 'loot');

      state.combat.active = false;
      state.combat.monster = null;

      if (state.combat.context === 'wilderness') {
        logCallback(`You defeated the ${monster.name}. The road is clear.`, 'heal');
      }

      if (monster.isBoss || monster.name === 'Dark Knight') {
        logCallback(`The Dark Knight has fallen! You have conquered the Dungeon of Shadows!`, 'player-crit');
        if (typeof window.showVictoryModal === 'function') {
          window.showVictoryModal();
        } else {
          const modal = document.getElementById('victory-modal');
          if (modal) modal.classList.remove('hidden');
        }
      }

      this.awardXp(state, monster.xpReward, logCallback);
    }

    static awardXp(state, amount, logCallback) {
      if (amount <= 0) return;
      const c = state.character;
      c.xp += amount;

      let reqXp = c.level * 100 + (c.level - 1) * 50;
      while (c.xp >= reqXp) {
        c.level += 1;
        const cls = DOS.CLASSES[c.className] || DOS.CLASSES.Fighter;
        const hpInc = cls.hpPerLevel + DOS.getStatModifier(c.stats.CON);
        c.maxHp += hpInc;
        c.hp = c.maxHp;

        c.stats[cls.primaryStat] += 1;
        c.stats.CON += 1;

        logCallback(`LEVEL UP! You are now Level ${c.level}! Max HP increased (+${hpInc}). HP fully restored!`, 'levelup');
        reqXp = c.level * 100 + (c.level - 1) * 50;
      }
    }
  }

  DOS.CombatSystem = CombatSystem;
  DOS.startCombat = startCombat;
  DOS.getCombatViewModel = getCombatViewModel;

})(window.DOS);
