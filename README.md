# Dungeon of Shadows - Procedural Open-World Fantasy RPG

A procedurally generated, replayable, D&D-inspired open-world fantasy RPG running entirely in the browser using HTML5, CSS3, and vanilla JavaScript over the `file://` protocol.

---

## Technical Overview & Requirements

- **Zero External Dependencies**: Pure HTML, CSS, and JS (No Node.js, npm, frameworks, or backend required).
- **Procedural Open-World Generation**: Deterministic seeded island terrain (value noise), biomes, settlements, A* road networks, and procedurally regenerating dungeons.
- **6 Classes & 6 Races**: Fighter, Wizard, Rogue, Cleric, Ranger, Paladin & Human, Elf, Dwarf, Halfling, Orc, Ignan.
- **D&D Combat & Skill Checks**: d20-based attack rolls, signature class skills, critical hits (natural 20) and critical misses (natural 1).
- **Special Story Arc**: Hand-crafted 10-room **Dungeon of Shadows** containing the Dark Knight boss fight. Defeating the Dark Knight unlocks the option to continue exploring the open world.
- **Save System & Migration**: Seamless `localStorage` state persistence with versioning and corrupted save protection.
- **Optional LLM Narrator Abstraction Layer**: Flavour text generation supporting local/OpenAI-compatible endpoints with automatic procedural fallbacks.
- **In-Browser Test Runner**: Run `tests.html` directly in the browser to verify seed reproducibility, dice bounds, clamping, and save roundtrips.

---

## File Structure

```text
index.html              # Main HTML entry point
style.css               # RPG parchment theme and responsive styles
script.js               # Bootstrap and UI orchestrator
js/
  rng.js               # Seeded cyrb53 hash + sfc32 PRNG
  dice.js              # Dice notation engine (rollDie, rollDice)
  data.js              # Class, Race, and Item static catalogs
  state.js             # Central state object & clamping helpers
  save.js              # Save system & migration
  time.js              # Turn-based calendar system
  terrain.js           # 2D value noise island terrain generator
  towns.js             # Settlement & city generator
  roads.js             # A* pathfinding & road network generator
  npcs.js              # Persistent NPC & rumour generator
  monsters.js          # Monster catalog
  loot.js              # Loot & equipment generator
  dungeons.js          # Procedural dungeon generator & regeneration engine
  quests.js            # Guild quest & chain generator
  events.js            # Travel & exploration skill check events
  events_world.js      # Living world events & endgame locations
  reputation.js        # Settlement & guild reputation system
  combat.js            # Turn-based combat state machine
  narrator.js          # LLM narrator abstraction layer
  map.js               # Canvas map renderer with fog of war
  world.js             # World generation orchestrator
  debug.js             # Developer debug tools (?debug=true)
tests.html             # In-browser test runner
tests/tests.js         # Automated test suite
README.md              # Project documentation
```

---

## How to Run & Test

1. Double-click `index.html` in any web browser to play the game.
2. Double-click `tests.html` to run the automated in-browser unit tests.
3. Append `?debug=true` to `index.html` in the browser address bar to enable developer debug controls.
