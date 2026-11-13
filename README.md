# CJ-1307 · Chris Jose portfolio

A scroll story: a train arrives out of the warp, you ride inside it, and every stop is its own scene.
React + Vite + TypeScript · Three.js (react-three-fiber, hardware chapter only) · Lenis · hand-built canvas/SVG scenes

    npm install
    npm run dev          # http://127.0.0.1:5173
    npm run build        # type-checks, builds to dist/
    npm run preview      # serves dist/ on 4173

- `dist/` is fully static (`base: './'`). The Lucen prototype lives at `dist/lucen/index.html`.
- Each chapter (`src/scenes/*`) is a tall section with a sticky stage. `src/story/engine.ts` turns scroll into a 0..1 progress per chapter and calls that scene every frame.
- `?static` (or reduced motion) shows every scene finished, in normal document flow, with no smooth scroll.
- `?debug` exposes `window.__cj` (`jump('plix', 0.5)` jumps a chapter to a given progress).
- All copy and data: `src/content.ts`. Exclusion scan: `node scripts/audit.mjs` (needs `npm run preview` running).
