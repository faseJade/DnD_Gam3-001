/* Dungeon of Shadows - Random Travel Events & Exploration Checks */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  const TRAVEL_EVENTS = [
    {
      id: 'bandit_ambush',
      title: 'Bandit Ambush!',
      desc: 'Armed highwaymen leap from the bushes demanding your purse!',
      checkSkill: 'Perception',
      dc: 12,
      onSuccess: 'You spot the ambush early and take high ground before combat begins!',
      onFail: 'You are caught off-guard as combat starts!',
      triggerMonster: 'Bandit'
    },
    {
      id: 'travelling_merchant',
      title: 'Travelling Merchant',
      desc: 'A weary merchant pulling a loaded handcart offers a trade.',
      checkSkill: 'Persuasion',
      dc: 11,
      onSuccess: 'The merchant offers a discount and gives you a free Health Potion!',
      onFail: 'The merchant sells goods at standard prices.',
      rewardItem: 'potion_health'
    },
    {
      id: 'ancient_shrine',
      title: 'Mystic Altar',
      desc: 'You stumble upon an ancient moss-covered stone shrine emitting soft light.',
      checkSkill: 'Arcana',
      dc: 12,
      onSuccess: 'You recite an ancient prayer and feel a surge of divine blessing (+15 HP heal)!',
      onFail: 'The altar remains silent.',
      healAmount: 15
    },
    {
      id: 'abandoned_campsite',
      title: 'Abandoned Campsite',
      desc: 'You find an abandoned camp with cold ashes and a lost leather pouch.',
      checkSkill: 'Investigation',
      dc: 10,
      onSuccess: 'You search the camp thoroughly and discover 35 Gold!',
      onFail: 'You find only rusted tin cups.',
      rewardGold: 35
    }
  ];

  class EventGenerator {
    constructor(worldSeed) {
      this.rng = new DOS.RNG(worldSeed).subRNG('events');
    }

    checkTravelEvent(state, tile) {
      if (!state || !tile) return null;

      // Event frequency based on tile danger & road presence
      let eventChance = 0.10 + (tile.danger * 0.04);
      if (tile.hasRoad) eventChance *= 0.5; // Safe roads reduce ambush rate

      if (this.rng.random() < eventChance) {
        return this.rng.pick(TRAVEL_EVENTS);
      }
      return null;
    }

    performSkillCheck(state, skillName, dc) {
      const c = state.character;
      const attrMap = {
        Perception: 'WIS',
        Survival: 'WIS',
        Stealth: 'DEX',
        Athletics: 'STR',
        Arcana: 'INT',
        Persuasion: 'CHA',
        Investigation: 'INT'
      };

      const attr = attrMap[skillName] || 'WIS';
      const mod = DOS.getStatModifier(c.stats[attr] || 10);
      const d20 = DOS.rollDie(20);
      const total = d20 + mod;

      const isCritSuccess = d20 === 20;
      const isCritFail = d20 === 1;
      const isSuccess = isCritSuccess || (!isCritFail && total >= dc);

      return {
        d20: d20,
        mod: mod,
        total: total,
        dc: dc,
        isSuccess: isSuccess,
        isCritSuccess: isCritSuccess,
        isCritFail: isCritFail,
        logText: `${skillName} Check: Roll ${d20} + ${mod} = ${total} vs DC ${dc} — ${isSuccess ? 'SUCCESS!' : 'FAILED!'}`
      };
    }
  }

  DOS.EventGenerator = EventGenerator;

})(window.DOS);
