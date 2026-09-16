/* Dungeon of Shadows - Quest Generator & Chains */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  class QuestGenerator {
    constructor(worldSeed) {
      this.worldSeed = worldSeed;
    }

    generateTownQuests(settlement, dayNumber) {
      const rng = new DOS.RNG(`${this.worldSeed}:quests:${settlement.id}:${dayNumber}`);
      const count = rng.int(2, 4);
      const quests = [];

      for (let i = 0; i < count; i++) {
        const questId = `quest_${settlement.id}_d${dayNumber}_${i}`;
        const qType = rng.pick(['Hunt', 'Dungeon', 'Delivery', 'Rescue']);

        let title = '';
        let desc = '';
        let goldReward = rng.int(50, 200);
        let xpReward = rng.int(40, 150);

        if (qType === 'Hunt') {
          title = `Hunt Goblins near ${settlement.name}`;
          desc = `Local bandits and goblins have been ambushing travelers outside ${settlement.name}. Clear them out.`;
        } else if (qType === 'Dungeon') {
          title = `Explore the Local Dungeon`;
          desc = `The Adventurer Guild requests a full sweep of the nearby dungeon depths.`;
          goldReward += 100;
          xpReward += 80;
        } else if (qType === 'Delivery') {
          title = `Deliver Supplies`;
          desc = `Deliver an urgent crate of medical herbs to the neighboring settlement.`;
        } else {
          title = `Rescue Lost Explorer`;
          desc = `A local scholar went missing while studying ancient ruins. Bring them back safely.`;
        }

        quests.push({
          id: questId,
          type: qType,
          title: title,
          desc: desc,
          giverTownId: settlement.id,
          goldReward: goldReward,
          xpReward: xpReward,
          completed: false
        });
      }

      return quests;
    }
  }

  DOS.QuestGenerator = QuestGenerator;

})(window.DOS);
