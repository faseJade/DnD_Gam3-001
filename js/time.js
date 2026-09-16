/* Dungeon of Shadows - Time System */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
  const DAYS_PER_SEASON = 30;

  class TimeSystem {
    static advanceTime(state, days = 1) {
      if (!state || !state.date) return;

      state.date.day += days;
      state.date.totalDays += days;

      while (state.date.day > DAYS_PER_SEASON) {
        state.date.day -= DAYS_PER_SEASON;
        const currentSeasonIdx = SEASONS.indexOf(state.date.season);
        const nextSeasonIdx = (currentSeasonIdx + 1) % SEASONS.length;
        state.date.season = SEASONS[nextSeasonIdx];

        if (nextSeasonIdx === 0) {
          state.date.year += 1;
        }
      }
    }

    static getDateString(state) {
      if (!state || !state.date) return 'Year 1 — Spring — Day 1';
      return `Year ${state.date.year} — ${state.date.season} — Day ${state.date.day}`;
    }
  }

  DOS.TimeSystem = TimeSystem;

})(window.DOS);
