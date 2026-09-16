/* Dungeon of Shadows - NPCs & Rumours Engine */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  const NPC_NAMES = ['Mira', 'Aldric', 'Gideon', 'Thalia', 'Balthazar', 'Seraphina', 'Vance', 'Lyra', 'Rowan', 'Kaelen'];
  const OCCUPATIONS = ['Tavern Keeper', 'Guildmaster', 'Blacksmith', 'Guard Captain', 'Wandering Scholar', 'Alchemist'];

  class NPCGenerator {
    constructor(worldSeed) {
      this.worldSeed = worldSeed;
    }

    generateSettlementNPCs(settlement) {
      const rng = new DOS.RNG(`${this.worldSeed}:npcs:${settlement.id}`);
      const count = rng.int(2, 4);
      const npcs = [];

      for (let i = 0; i < count; i++) {
        const name = rng.pick(NPC_NAMES) + ' ' + rng.pick(['Thorn', 'Ironhand', 'Brightwood', 'Raven', 'Storm']);
        const race = rng.pick(Object.keys(DOS.RACES));
        const occ = rng.pick(OCCUPATIONS);
        npcs.push({
          id: `npc_${settlement.id}_${i}`,
          name: name,
          race: race,
          occupation: occ,
          homeTownId: settlement.id,
          relationship: 0,
          rumour: `They say strange shadows gather near the dungeons outside ${settlement.name}.`
        });
      }

      return npcs;
    }
  }

  DOS.NPCGenerator = NPCGenerator;

})(window.DOS);
