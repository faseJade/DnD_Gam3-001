/* Dungeon of Shadows - World Events & Endgame Locations Engine */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  const ENDGAME_LOCATIONS = [
    { id: 'endgame_dragon', name: "Dragon's Lair", difficulty: 10, desc: 'A volcanic cavern home to an ancient red dragon.' },
    { id: 'endgame_demon', name: "Demon Gate", difficulty: 10, desc: 'A dark portal crackling with demonic energy.' },
    { id: 'endgame_tree', name: "Ancient World Tree", difficulty: 10, desc: 'A colossus tree corrupted by abyssal root poison.' },
    { id: 'endgame_titan', name: "Titan's Tomb", difficulty: 10, desc: 'A megalithic stone crypt built by primordial giants.' },
    { id: 'endgame_fortress', name: "The Abyssal Fortress", difficulty: 10, desc: 'A floating dread fortress above a bottomless chasm.' },
    { id: 'endgame_king', name: "The Forgotten King's Castle", difficulty: 10, desc: 'A spectral castle shrouded in eternal fog.' }
  ];

  class EventSystem {
    constructor(worldSeed) {
      this.worldSeed = worldSeed;
    }

    checkWorldEvents(state) {
      if (!state || !state.worldEvents) return;
      const rng = new DOS.RNG(`${this.worldSeed}:worldevents:${state.date.totalDays}`);

      // Occasional random living world event every 10 days
      if (state.date.totalDays % 10 === 0 && rng.random() < 0.4) {
        const events = [
          'A goblin war begins in the northern mountain region!',
          'A wealthy merchant caravan arrives at the capital city!',
          'Reports claim an ancient ruin has surfaced near the eastern coast!',
          'A strange magical portal has opened in the swamplands!'
        ];
        const eventText = rng.pick(events);
        state.worldEvents.push({
          day: state.date.totalDays,
          text: eventText
        });
      }
    }
  }

  DOS.ENDGAME_LOCATIONS = ENDGAME_LOCATIONS;
  DOS.EventSystem = EventSystem;

})(window.DOS);
