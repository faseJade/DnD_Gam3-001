/* Dungeon of Shadows - World Map & Fog of War Renderer */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  class MapSystem {
    constructor(canvasElement) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');
      this.tileSize = 10;
      this.sightRadius = 5;
    }

    updateFogOfWar(state, terrainData) {
      const { width, height } = terrainData;
      const px = state.playerPos.x;
      const py = state.playerPos.y;

      let fogArr;
      if (!state.fogOfWar || state.fogOfWar.length !== width * height) {
        fogArr = new Uint8Array(width * height); // 0: hidden, 1: explored
      } else {
        fogArr = new Uint8Array(state.fogOfWar.split('').map(c => parseInt(c, 10)));
      }

      for (let dy = -this.sightRadius; dy <= this.sightRadius; dy++) {
        for (let dx = -this.sightRadius; dx <= this.sightRadius; dx++) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            if (dx * dx + dy * dy <= this.sightRadius * this.sightRadius) {
              fogArr[ny * width + nx] = 1;
            }
          }
        }
      }

      state.fogOfWar = Array.from(fogArr).join('');
    }

    render(state, world) {
      if (!this.canvas || !world || !world.terrain) return;

      const { width, height, grid } = world.terrain;
      this.canvas.width = width * this.tileSize;
      this.canvas.height = height * this.tileSize;

      const fogStr = state.fogOfWar || '';

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const tile = grid[idx];
          const isExplored = fogStr[idx] === '1';

          const drawX = x * this.tileSize;
          const drawY = y * this.tileSize;

          if (!isExplored) {
            this.ctx.fillStyle = '#0a080d';
            this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
            continue;
          }

          // Biome color
          const biomeInfo = DOS.BIOMES[tile.biome.toUpperCase()] || DOS.BIOMES.PLAINS;
          this.ctx.fillStyle = biomeInfo.color;
          this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);

          // Road overlay
          if (tile.hasRoad) {
            this.ctx.fillStyle = '#d7ccc8';
            this.ctx.fillRect(drawX + 3, drawY + 3, this.tileSize - 6, this.tileSize - 6);
          }
        }
      }

      // Render Locations (Settlements and Dungeons)
      if (world.settlements) {
        world.settlements.forEach(s => {
          const idx = s.y * width + s.x;
          if (fogStr[idx] === '1') {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(s.symbol, s.x * this.tileSize + 5, s.y * this.tileSize + 9);
          }
        });
      }

      if (world.dungeons) {
        world.dungeons.forEach(d => {
          const idx = d.y * width + d.x;
          if (fogStr[idx] === '1') {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💀', d.x * this.tileSize + 5, d.y * this.tileSize + 9);
          }
        });
      }

      // Render Player Position
      const px = state.playerPos.x;
      const py = state.playerPos.y;
      this.ctx.fillStyle = '#00ffff';
      this.ctx.beginPath();
      this.ctx.arc(px * this.tileSize + 5, py * this.tileSize + 5, 4, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  DOS.MapSystem = MapSystem;

})(window.DOS);
