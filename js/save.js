/* Dungeon of Shadows - Save System */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  const SAVE_KEY = 'dungeon_of_shadows_save_v2';

  function saveGame(state) {
    if (!state || !state.inGame) return false;
    try {
      state.version = 2; // Always tag with current save version
      const jsonStr = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, jsonStr);
      return true;
    } catch (err) {
      console.error('Save failed:', err);
      return false;
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem('dungeon_of_shadows_save');
      if (!raw) return null;

      let loaded = JSON.parse(raw);

      if (!loaded || typeof loaded !== 'object') return null;

      // Migration from Version 1 (Base Game) to Version 2 (Open World)
      if (loaded.version === 1 || !loaded.version) {
        loaded.version = 2;
        loaded.worldSeed = loaded.worldSeed || String(Math.floor(Math.random() * 1000000000));
        loaded.date = loaded.date || { year: 1, season: 'Spring', day: 1, totalDays: 1 };
        loaded.playerPos = loaded.playerPos || { x: 0, y: 0 };
        loaded.activeLocationId = 'dungeon_of_shadows';
        loaded.currentView = 'DUNGEON';
        loaded.quests = loaded.quests || { active: [], completed: [], failed: [] };
        loaded.reputation = loaded.reputation || { global: 0, settlements: {}, guilds: {} };
        loaded.dungeons = loaded.dungeons || {};
        loaded.worldEvents = loaded.worldEvents || [];
        loaded.narrator = loaded.narrator || {
          enabled: false,
          provider: 'openai',
          endpoint: 'http://localhost:11434/v1',
          model: 'llama3',
          apiKey: '',
          cache: {}
        };
      }

      // Validate character state
      if (loaded.character) {
        DOS.validateCharacter(loaded.character);
      } else {
        return null;
      }

      // Ensure lists and structures are intact
      loaded.inventory = Array.isArray(loaded.inventory) ? loaded.inventory : [];
      loaded.equipment = loaded.equipment || {};
      loaded.logs = Array.isArray(loaded.logs) ? loaded.logs : [];

      return loaded;
    } catch (err) {
      console.error('Load failed / corrupted save:', err);
      return null;
    }
  }

  function deleteSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem('dungeon_of_shadows_save');
      return true;
    } catch (err) {
      console.error('Delete save failed:', err);
      return false;
    }
  }

  DOS.saveGame = saveGame;
  DOS.loadGame = loadGame;
  DOS.deleteSave = deleteSave;

})(window.DOS);
