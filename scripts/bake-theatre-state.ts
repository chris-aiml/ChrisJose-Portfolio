/**
 * Bakes src/theatre/acts.ts into a static Theatre.js project state (src/theatre/state.json).
 * Runtime imports that JSON, so @theatre/studio is never needed in production.
 */
import { writeFileSync } from 'node:fs'
import { TRACKS, SEQ_LEN, SHEET, STEP, type Series } from '../src/theatre/acts'

/** Fritsch–Carlson monotone cubic interpolation (no overshoot). */
function pchip(pts: [number, number][]) {
  const n = pts.length
  const x = pts.map((p) => p[0]), y = pts.map((p) => p[1])
  const d: number[] = [], m: number[] = new Array(n).fill(0)
  for (let i = 0; i < n - 1; i++) d[i] = (y[i + 1] - y[i]) / (x[i + 1] - x[i])
  m[0] = d[0]; m[n - 1] = d[n - 2]
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i] }
  }
  return (t: number) => {
    if (t <= x[0]) return y[0]
    if (t >= x[n - 1]) return y[n - 1]
    let i = 0; while (t > x[i + 1]) i++
    const h = x[i + 1] - x[i], u = (t - x[i]) / h
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u
    const h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2
    return h00 * y[i] + h10 * h * m[i] + h01 * y[i + 1] + h11 * h * m[i + 1]
  }
}

let idc = 0
const nid = () => 'k' + (idc++).toString(36)
const round = (v: number) => Math.round(v * 1e5) / 1e5

function keysFor(series: Series) {
  const pts = series.pts
  let positions: number[], values: number[]
  if (series.mode === 'linear') {
    positions = pts.map((p) => p[0]); values = pts.map((p) => p[1])
  } else {
    const f = pchip(pts)
    const t0 = pts[0][0], t1 = pts[pts.length - 1][0]
    positions = []; for (let t = t0; t < t1 + 1e-9; t += STEP) positions.push(round(t))
    if (positions[positions.length - 1] !== t1) positions.push(t1)
    values = positions.map((t) => round(f(t)))
  }
  return positions.map((position, i) => ({
    id: nid(), position, connectedRight: true,
    handles: [0.5, 0.5, 0.5, 0.5], // handles on the diagonal == strictly linear segment
    type: 'bezier', value: values[i],
  }))
}

const tracksByObject: Record<string, any> = {}
let total = 0
for (const [obj, props] of Object.entries(TRACKS)) {
  const trackData: Record<string, any> = {}, trackIdByPropPath: Record<string, string> = {}
  for (const [path, series] of Object.entries(props)) {
    const id = 't' + (idc++).toString(36)
    const keyframes = keysFor(series)
    total += keyframes.length
    trackData[id] = { type: 'BasicKeyframedTrack', __debugName: `${obj}:${path}`, keyframes }
    trackIdByPropPath[JSON.stringify(path.split('.'))] = id
  }
  tracksByObject[obj] = { trackData, trackIdByPropPath }
}

const state = {
  sheetsById: {
    [SHEET]: {
      staticOverrides: { byObject: {} },
      sequence: { subUnitsPerUnit: 30, length: SEQ_LEN, type: 'PositionalSequence', tracksByObject },
    },
  },
  definitionVersion: '0.4.0',
  revisionHistory: [],
}
writeFileSync(new URL('../src/theatre/state.json', import.meta.url), JSON.stringify(state))
console.log(`baked ${total} linear keyframes across ${Object.keys(TRACKS).length} objects -> src/theatre/state.json`)
