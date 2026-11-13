# CJ-1307 · Chris Jose portfolio

React + Vite + TypeScript · Three.js (react-three-fiber) · Theatre.js · Lenis

    npm install
    npm run dev          # http://127.0.0.1:5173   (add ?studio to open Theatre Studio, dev only)
    npm run build        # bakes the timeline, type-checks, builds to dist/
    npm run preview      # serves dist/ on 4173

- `dist/` is fully static (`base: './'`): upload it anywhere. The Lucen prototype lives at `dist/lucen/index.html`.
- `?static` (or no WebGL) renders the same content with no canvas and no smooth scroll.
- `?debug` exposes `window.__cj` (`scroll.jumpToProgress(0..1)`, live scene state).
- Timeline: edit `src/theatre/acts.ts`, run `npm run bake` (writes `state.json`, the exported Theatre state used in production). `npm run verify:state` checks every segment is strictly linear.
- All copy and data: `src/content.ts`. Exclusion scan: `node scripts/audit.mjs` (needs `npm run preview` running).
