# Dungeon of Shadows - Fantasy RPG

A clean, polished, fully playable **D&D-inspired text fantasy RPG** built with vanilla HTML, CSS, and JavaScript. The game runs directly in any modern web browser without requiring external dependencies, libraries, build tools, or an internet connection.

---

## Features

- **Atmospheric Dark Fantasy Design**: Parchment panels, textured borders, responsive layout, clear HP/XP meters, and medieval typography.
- **Character Creation**: Select from 3 distinct classes (**Fighter**, **Wizard**, **Rogue**) and 3 fantasy races (**Human**, **Elf**, **Dwarf**) with customized ability score bonuses.
- **Dice System**: Standard d4, d6, d8, d10, d12, and d20 dice notation engine handling natural 20 critical hits (maximum + rolled damage) and natural 1 critical misses.
- **Turn-Based Combat**: Complete turn loop offering Attack, Defend (+4 Defense bonus for next enemy attack), Use Potion, and Run options.
- **Dynamic Dungeon Progression**: 10 rooms featuring random encounters (Monsters, Treasure, Traps, Healing Shrines, Empty rooms) climaxing with the **Dark Knight** boss in Room 10.
- **Inventory & Equipment**: Dynamic inventory management with weapon and shield equipping that directly modifies attack and defense stats. Safe potion consumption with full-HP checks.
- **Leveling & Advancement**: Multi-level XP threshold system increasing Max HP, fully restoring health, and boosting primary combat attributes upon level up.
- **Saving & Loading**: Seamless `localStorage` save and load functionality with error validation and corrupted save recovery.
- **Accessibility**: Semantic HTML elements, ARIA live region combat logs, keyboard focus rings, and high text contrast.

---

## File Structure

```text
.
├── index.html   # Core HTML5 layout and modal overlays
├── style.css    # RPG theme styling, responsive layout, and animations
├── script.js   # Game state, dice engine, combat state machine, and UI binder
└── README.md    # Documentation and game rules
```

---

## How to Run the Game

1. Double-click or open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).
2. No local server, node packages, or build steps are needed.

---

## Character Classes & Races

### Classes
- **Fighter**: High health pool and raw melee power. Primary Stat: **Strength**.
- **Wizard**: High spell attack potential. Primary Stat: **Intelligence**.
- **Rogue**: Nimble and difficult to hit. Primary Stat: **Dexterity**.

### Races
- **Human**: +1 to all Ability Scores.
- **Elf**: +2 Dexterity, +1 Intelligence.
- **Dwarf**: +2 Constitution, +1 Strength.

---

## Combat & Gameplay Mechanics

1. **Attack Calculation**: `D20 + Class/Equipment Attack Bonus >= Enemy Defense`.
   - **Natural 20**: Critical Hit! Deals maximum weapon damage plus roll bonus.
   - **Natural 1**: Critical Miss! The attack fails completely.
2. **Enemy Turn**: Surviving enemies automatically counter-attack after player actions.
3. **Defend**: Increases player defense by +4 until after the enemy's next attack.
4. **Run**: DC 11 Dexterity check to flee normal monsters (cannot flee the Room 10 boss).
5. **Potions**: Restores 18 HP (Health Potion) or 40 HP (Greater Health Potion). Potions cannot be consumed if already at Max HP.

---

## Saving & Loading

Click **Save Game** in the top navigation header at any time to save progress to browser `localStorage`. Click **Load Game** on any session to restore character stats, inventory, equipment, and current dungeon room.
