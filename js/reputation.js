/* Dungeon of Shadows - Reputation System */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  class ReputationSystem {
    static adjustReputation(state, factionKey, amount) {
      if (!state || !state.reputation) return;
      if (!state.reputation.settlements[factionKey]) {
        state.reputation.settlements[factionKey] = 0;
      }
      state.reputation.settlements[factionKey] = DOS.clamp(
        state.reputation.settlements[factionKey] + amount,
        -100,
        100
      );
      state.reputation.global = DOS.clamp(state.reputation.global + Math.floor(amount / 2), -100, 100);
    }
  }

  DOS.ReputationSystem = ReputationSystem;

})(window.DOS);
