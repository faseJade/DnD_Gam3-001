# Dungeon of Shadows: notes for Claude

## Project
- D&D-inspired procedural open-world browser RPG in plain HTML/CSS/vanilla JS.
- Must run by double-clicking index.html (file://): plain <script> tags only, no ES modules, no fetch() of local files, no npm/build tools, no external libraries.
- Game code lives in js/ under the global `window.DOS` namespace. script.js is the UI/bootstrap. Data tables are in js/data.js and js/monsters.js.
- Tests: tests.html + tests/tests.js (run in a browser). Every bug fix needs a real test that calls game code and would fail without the fix.

## Rules
- Never undo earlier fixes; all existing tests must keep passing.
- Before finishing, check index.html and tests.html for zero console errors (use Playwright/headless Chromium if available).
- Keep changes small and focused. Explain what changed and why in your comment or PR.
- After committing, confirm the commit actually contains file changes (`git show --stat HEAD`).
