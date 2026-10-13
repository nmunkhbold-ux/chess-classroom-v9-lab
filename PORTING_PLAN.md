# Migration roadmap from the existing V8 website to the isolated V9 lab

This document tracks feature parity. **Never change the main V8 repository or its Pages workflow as part of V9 lab work.**

| Feature | V9 development status | Acceptance criteria before any production switch |
| --- | --- | --- |
| cm-chessboard SVG board and standard pieces | Implemented in prototype, browser verification pending | Smooth rendering and movement at 1080p/4K in Chrome and Edge |
| chess.js legal game engine | Integrated in prototype, browser verification pending | Castling, check, en passant, promotion choices, mate and draw tests |
| Move history and undo/redo | Basic support | Branching analysis must match V8 behavior |
| Piece lesson | Initial free-move mode | Add example presets, movement hints, obstacles, captures |
| Board editor | Initial place/remove/free move support | Multiple pieces, clear history and reset, promotion setup |
| Notes, bilingual controls | Initial support | Full natural Mongolian translation throughout |
| Right-click arrows and circles | cm RightClickAnnotator integrated, browser verification pending | Colors, undo, clear, and cross-session persistence |
| Fullscreen/OBS | Initial layout | Window Capture works; instructor panel never leaks on recorded board |
| PGN and FEN | Basic game import/export | Round-trip test many legal games, variations and annotations |
| JSON lessons | V9 format only | Safe migration from V8 JSON; no data lost |
| Lesson templates | Not yet ported | All V8 starter examples work identically |
| Puzzles and hints | Not yet ported | Verify multiple answers and teacher controls |
| Chapters / variations | Not yet ported | Editable move tree and teacher script at each node |
| Timers and sounds | Not yet ported | Accurate clocks and optional move/capture sounds |
| Browser automated tests | Not run locally (npm inaccessible) | GitHub CI + Playwright desktop and fullscreen tests green |

## Safe release policy

1. Keep development in `nmunkhbold-ux/chess-classroom-v9-lab`.
2. Make a clean GitHub Pages preview in the V9 lab repository, separate from production.
3. Record a full sample lesson and compare against the V8 site.
4. Port V8 lesson files through a separately tested migration step.
5. Never deploy to the V8 repo without an explicit, separate approval.
