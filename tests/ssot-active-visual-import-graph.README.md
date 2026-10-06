# Active visual import graph SSOT gate

This file documents the intent of `ssot-active-visual-import-graph.test.ts`.

- Runtime ownership remains in the real router (`AppRoutes.tsx`) and active lazy imports.
- Visual token ownership remains in `src/index.css` and the existing visual SSOT validator.
- The test only derives reachability from real internal imports and rejects raw runtime colors or legacy fonts in reachable `.tsx`, `.jsx` and `.css` sources.
- Post-MVP code is not activated by this gate; it is traversed only when the active runtime imports it.
- Dev previews, stories and isolated fixtures do not become active roots automatically.
