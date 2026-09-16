/* Dungeon of Shadows - Developer Debug Panel */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  class DebugSystem {
    static init(state, renderCallback) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('debug') !== 'true') return;

      let debugBar = document.getElementById('debug-panel');
      if (!debugBar) {
        debugBar = document.createElement('div');
        debugBar.id = 'debug-panel';
        debugBar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#100d14;color:#ffd700;border-top:2px solid #c59b27;padding:8px;z-index:9999;font-size:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;';
        document.body.appendChild(debugBar);
      }

      debugBar.innerHTML = `
        <strong>DEBUG TOOLS:</strong>
        <button id="dbg-add-xp" class="btn btn-mini">+500 XP</button>
        <button id="dbg-add-gold" class="btn btn-mini">+1000 Gold</button>
        <button id="dbg-reveal-map" class="btn btn-mini">Reveal Map</button>
        <button id="dbg-advance-time" class="btn btn-mini">+5 Days</button>
      `;

      document.getElementById('dbg-add-xp').addEventListener('click', () => {
        DOS.CombatSystem.awardXp(state, 500, (msg, type) => console.log(msg));
        renderCallback();
      });

      document.getElementById('dbg-add-gold').addEventListener('click', () => {
        state.character.gold += 1000;
        renderCallback();
      });

      document.getElementById('dbg-reveal-map').addEventListener('click', () => {
        if (state.fogOfWar) {
          state.fogOfWar = '1'.repeat(state.fogOfWar.length);
        }
        renderCallback();
      });

      document.getElementById('dbg-advance-time').addEventListener('click', () => {
        DOS.TimeSystem.advanceTime(state, 5);
        renderCallback();
      });
    }
  }

  DOS.DebugSystem = DebugSystem;

})(window.DOS);
