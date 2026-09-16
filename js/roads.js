/* Dungeon of Shadows - Road Generator & A* Pathfinding */

window.DOS = window.DOS || {};

(function (DOS) {
  'use strict';

  class MinHeap {
    constructor() { this.data = []; }
    push(item) { this.data.push(item); this.bubbleUp(this.data.length - 1); }
    pop() {
      if (this.data.length === 0) return null;
      const top = this.data[0];
      const bottom = this.data.pop();
      if (this.data.length > 0) {
        this.data[0] = bottom;
        this.sinkDown(0);
      }
      return top;
    }
    size() { return this.data.length; }
    bubbleUp(n) {
      const element = this.data[n];
      while (n > 0) {
        const parentN = Math.floor((n + 1) / 2) - 1;
        const parent = this.data[parentN];
        if (element.f >= parent.f) break;
        this.data[parentN] = element;
        this.data[n] = parent;
        n = parentN;
      }
    }
    sinkDown(n) {
      const length = this.data.length;
      const element = this.data[n];
      while (true) {
        let child2N = (n + 1) * 2, child1N = child2N - 1;
        let swap = null;
        if (child1N < length) {
          if (this.data[child1N].f < element.f) swap = child1N;
        }
        if (child2N < length) {
          if (this.data[child2N].f < (swap === null ? element.f : this.data[child1N].f)) swap = child2N;
        }
        if (swap === null) break;
        this.data[n] = this.data[swap];
        this.data[swap] = element;
        n = swap;
      }
    }
  }

  function findPathAStar(startX, startY, endX, endY, terrainData) {
    const { width, height, grid } = terrainData;
    const openSet = new MinHeap();
    const gScore = new Float32Array(width * height);
    const fScore = new Float32Array(width * height);
    const cameFrom = new Int32Array(width * height);

    gScore.fill(Infinity);
    fScore.fill(Infinity);
    cameFrom.fill(-1);

    const startIdx = startY * width + startX;
    const endIdx = endY * width + endX;

    gScore[startIdx] = 0;
    fScore[startIdx] = Math.hypot(endX - startX, endY - startY);
    openSet.push({ idx: startIdx, f: fScore[startIdx] });

    const dxs = [0, 1, 0, -1, 1, 1, -1, -1];
    const dys = [-1, 0, 1, 0, -1, 1, 1, -1];

    while (openSet.size() > 0) {
      const curr = openSet.pop();
      const currIdx = curr.idx;
      if (currIdx === endIdx) {
        // Reconstruct path
        const path = [];
        let p = endIdx;
        while (p !== -1) {
          path.push({ x: p % width, y: Math.floor(p / width) });
          p = cameFrom[p];
        }
        return path.reverse();
      }

      const cx = currIdx % width;
      const cy = Math.floor(currIdx / width);

      for (let i = 0; i < 8; i++) {
        const nx = cx + dxs[i];
        const ny = cy + dys[i];
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

        const neighborIdx = ny * width + nx;
        const tile = grid[neighborIdx];

        let moveCost = DOS.BIOMES[tile.biome.toUpperCase()] ? DOS.BIOMES[tile.biome.toUpperCase()].moveCost : 2.0;
        if (tile.hasRoad) moveCost *= 0.3; // Roads are very easy to travel

        const distStep = (i >= 4) ? 1.414 : 1.0;
        const tentativeG = gScore[currIdx] + moveCost * distStep;

        if (tentativeG < gScore[neighborIdx]) {
          cameFrom[neighborIdx] = currIdx;
          gScore[neighborIdx] = tentativeG;
          const h = Math.hypot(endX - nx, endY - ny);
          fScore[neighborIdx] = tentativeG + h;
          openSet.push({ idx: neighborIdx, f: fScore[neighborIdx] });
        }
      }
    }

    return [];
  }

  function connectSettlements(settlements, terrainData) {
    if (!settlements || settlements.length < 2) return;

    // Minimum Spanning Tree (Prim's algorithm)
    const connected = [settlements[0]];
    const unconnected = settlements.slice(1);

    while (unconnected.length > 0) {
      let minDist = Infinity;
      let bestFrom = null;
      let bestTo = null;
      let bestToIdx = -1;

      for (const u of connected) {
        for (let i = 0; i < unconnected.length; i++) {
          const v = unconnected[i];
          const dist = Math.hypot(u.x - v.x, u.y - v.y);
          if (dist < minDist) {
            minDist = dist;
            bestFrom = u;
            bestTo = v;
            bestToIdx = i;
          }
        }
      }

      if (bestFrom && bestTo) {
        const path = findPathAStar(bestFrom.x, bestFrom.y, bestTo.x, bestTo.y, terrainData);
        path.forEach(pt => {
          const tile = terrainData.grid[pt.y * terrainData.width + pt.x];
          tile.hasRoad = true;
        });

        connected.push(bestTo);
        unconnected.splice(bestToIdx, 1);
      }
    }
  }

  DOS.findPathAStar = findPathAStar;
  DOS.connectSettlements = connectSettlements;

})(window.DOS);
