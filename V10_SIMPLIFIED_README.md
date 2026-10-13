# Chess Classroom V10 — Simplified Single-Tab Teaching Studio (Experimental)

**Development only.** This page is on branch `v10-simplified-single-tab`, separate from the published V8, V9, and older V10 recording-studio pages. It is not deployed to the GitHub Pages site.

## Start locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/v10-simple.html`. There is **one browser tab only**, containing an interactive teaching board left (66%) and a clear teacher camera area right (34%) for OBS compositing.

## During teaching

- Click a piece and destination to move it freely. Click a piece to show its possible teaching moves.
- Use `M` Move, `A` Arrow, `C` Circle, `D` Draw, `E` Erase.
- `U` Undo, `Shift+U` Redo, `B` Flip board, `Space` toggle move hints.
- `F` fullscreen within the **same tab**; tools still work in fullscreen.
- `H` hide/restore the bottom toolbar. A restore button is also available.
- `S` save a new position/teaching step; `←` and `→` navigate saved steps.
- `P` open/close teaching setup with piece placement, board reset, and JSON import/export.
- `?` show shortcut guide; EN/МН toggles interface language.
- Lesson changes are automatically saved in localStorage. Export JSON for durable backups.

The teacher-camera area is deliberately **empty in fullscreen**. Overlay your camera in OBS while capturing this single Chrome window; no camera hardware access or OBS integration is built into the page.

## Engineering

- Reuses V10's `createBoard` and annotation/partial eraser implementation.
- Reuses position/FEN geometry from V9; adds a small validated, script-free lesson format.
- Adds isolated `v10-simple.html`, `src/v10-simple/`, `test/v10-simple.test.js` and `test/v10-simple-browser.mjs`.
- `npm run simple-check` runs tests and production build; isolated branch CI packages a `dist` artifact **without deploying**.
- Legacy V10 lesson exports may be imported for basic positions and annotations; private narrator notes are intentionally stripped.
- Existing `index.html`, `v10.html`, and `v10-output.html` remain untouched.
