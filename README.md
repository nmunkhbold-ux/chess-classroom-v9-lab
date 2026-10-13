# Chess Classroom V9 Lab

**Experimental rebuild. It does not replace or deploy the existing live Chess Classroom V8 website.**

Live website: https://nmunkhbold-ux.github.io/chess-classroom-studio/
Live repository: https://github.com/nmunkhbold-ux/chess-classroom-studio

## Stack

- **cm-chessboard** v8.15.3 — board SVG, piece movement input, right-click annotation extension (MIT code)
- **chess.js** v1.x — legal moves, check, checkmate, FEN and PGN (BSD-2-Clause)
- **Vite** — local development, bundling and GitHub Pages static deployment
- Plain JavaScript modules; no React or database necessary.

**Artwork licensing:** cm-chessboard's `standard.svg` pieces are **CC BY-SA 3.0**, not MIT. The package's `staunty.svg` art is CC BY-NC-SA 4.0 and is deliberately not used. Full credits in `THIRD_PARTY_NOTICES.md`.

## Local setup

```bash
npm install
npm test
npm run dev
```

Open the address printed by Vite (usually `http://localhost:5173`).

`npm run build` makes a static deployable `dist/` directory.

## Deploy in a **separate** GitHub repository

1. Create a new public repository named **`chess-classroom-v9-lab`** under `nmunkhbold-ux` (leave it uninitialized).
2. Give the GitHub app used by ChatGPT access to the new repository: https://github.com/settings/installations/169462457
3. Upload this project's files, preserving `.github/workflows/deploy.yml`. To upload locally, run:

```bash
git init
git branch -M main
git add .
git commit -m "Initial V9 development preview"
git remote add origin https://github.com/nmunkhbold-ux/chess-classroom-v9-lab.git
git push -u origin main
```

4. In **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**.
5. GitHub Actions runs tests, builds, and deploys to `https://nmunkhbold-ux.github.io/chess-classroom-v9-lab/`.

Nothing here changes the live V8 repo. Merge changes from V9 to V8 only after explicit approval and feature-parity testing.

## Current prototype features

- Separate **Full Game** mode using chess.js for legal moves and PGN/FEN.
- **Piece Lesson** and **Board Editor** with free moves and arbitrary pieces (valid without kings), intentionally bypassing chess.js legality.
- cm-chessboard standard SVG pieces, drag/click movement, marker/arrow right-click extension.
- English / Mongolian interface, fullscreen/OBS-style presentation, basic lesson notes and JSON backups.
- Local unit tests for the special position editing code.

## Not yet feature-parity with V8

This is **development preview only**. V8's complete chapter/variation tree, all teaching presets, advanced clocks, puzzle grading, custom annotations linked to tree nodes, and full old-format JSON import are **not yet ported**. A migration adapter and browser regression suite are required before any production switch.

CI build and browser interaction behavior must also be validated after installing the npm dependencies; unit tests alone do not prove the whole interface works.

## V8 teaching tools ported into V9 Lab (October 2026)

- **Show moves**: click a piece to highlight destinations (dots) and captures (red markers). In Full Game the moves come from `chess.js`; in Piece Lesson and Board Editor, they come from teaching geometry that works without kings and respects blockers.
- **Drawing tools**: Move / Arrow / Circle / Erase; choose green, blue, red or orange. Click two squares for an arrow, one for a circle; click the same annotation to remove it. Right-click / right-drag annotations also remain available through cm-chessboard.
- **Piece Lesson examples**: Open, Blockers and Captures for the selected piece and side. Place/remove friendly or opposing pieces directly in Piece Lesson without switching to Board Editor.
- **Move history navigation**: clickable moves and first / previous / next / last buttons. Back and forward move history is kept until a new chess move is made.
- **Lesson slides**: Save the current board, notes, title and arrows/circles as a slide. Click slides or use Previous / Next; delete saved slides. Slides are stored in browser autosave and included in downloaded lesson JSON.
- **Keyboard**: F for fullscreen, M for the teaching panel in fullscreen, Left/Right for undo/redo.

**Current limitations:** Piece Lesson geometric hints intentionally omit chess check/pins; the regular Full Game uses `chess.js` and obeys normal rules. Board Editor deliberately allows any placement. Game slides store a FEN position (not complete previous PGN history). The optional lesson examples are teaching illustrations, not real-game puzzles. This remains the separate V9 Lab, not the live V8 app.

## Clean Classroom redesign (2026-10-13)

The redesigned V9 Lab is board-first: one compact toolbar, a three-mode Play / Teach / Setup switch, a small mode-specific inspector, and an intentionally collapsed **Advanced tools** drawer. No features were deleted: import/export, FEN, lesson placement tools, camera positioning, notes, annotation colors, and lesson-file tools are still available through advanced sections or their own expandable area. The previous dense V9 UI is preserved on branch `archive/v9-dense-ui-2026-10-13`.

**Teacher shortcuts:** F enters/leaves presentation mode, M shows/hides the inspector in presentation mode, left/right arrows undo/redo (outside text inputs). In presentation, the board and a compact teaching toolbar remain visible. The Tools button can reopen the inspector.

**QA:** In addition to chess/unit tests, the Chromium smoke test verifies compact layout, click moves, arrows/circles, lesson setup behind Advanced Tools, navigation, editing, bilingual controls, and responsive stacking.
