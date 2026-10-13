# Chess Classroom V10 — Prerecorded Lesson Studio

V10 is developed on the **`v10-recording-studio` branch**, **separately from the V9 GitHub Pages preview and production V8**. This branch adds `v10.html` and `v10-output.html` without changing V9's `index.html`.

## Running locally

1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173/v10.html`.
4. Click **Open Recording Output** to open `/v10-output.html` in another window.
5. Capture **only the separate Recording Output window** in OBS (window capture). Place instructor camera over the reserved white area using OBS.

V10 uses `BroadcastChannel` and browser `localStorage` to synchronize windows with the **same origin/profile**. OBS's independent Browser Source is **not** compatible with this communication path; use OBS Window Capture for this version.

## Main workflow

- Build scenes; duplicate, delete and reorder using the scene list (drag and drop). Use **Try sample** to load an eight-scene Mongolian knight-movement lesson.
- Edit title, chapter, subtitle, board position, pieces and scene-specific drawings.
- Add progressive reveal steps (highlight, circle, arrow, text, move sequence, clear).
- Navigate scenes with ←/→ and reveals using Space / Shift+Space. R restarts, P replays a move action.
- Store a private script per scene and use the teleprompter; notes **do not** render in the OBS output.
- Choose the intro, board+presenter, board-only, exercise, answer, or summary output template.
- Export a version 10 lesson JSON backup. Basic import of V9 version 1 lesson documents is available.

## Current scope and limitations

This is a **functional development prototype, not a released classroom product**. Editor/output sync supports two windows in the same browser profile. Do not mistake opening the recording output for starting OBS recording.

Animations currently demonstrate ordered **piece relocation** without enforcing chess legality; custom positions without kings are supported. Some special-move visuals and transitions still need hands-on review. Freehand drawings support partial erasing and are part of scene storage, but advanced vector editing and exact preservation of all legacy V9 arrow/freehand JSON formats are not implemented. Instructor UI translation coverage is partial (core storyboard/settings labels are bilingual); all remaining captions require bilingual pass. Recording templates require actual OBS recording tests at 1080p and 720p.

V9 stays available at https://nmunkhbold-ux.github.io/chess-classroom-v9-lab/ and V8 stays at https://nmunkhbold-ux.github.io/chess-classroom-studio/ .

## CI

`npm test` tests data model and existing chess logic. `npm run v10-browser-test` tests two-window sync, private notes, scenes, reveals, and output layout. `npm run build` bundles all three entry points via Vite. V10 workflow **uploads a downloadable build artifact** and does **not deploy to Pages**, avoiding any overwrite of V9.
