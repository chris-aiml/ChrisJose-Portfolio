import core from '@theatre/core'
import { readFileSync } from 'node:fs'
import { TRACKS, SEQ_LEN, SHEET, PROJECT } from '../src/theatre/acts'
const { getProject, types } = core as any

const state = JSON.parse(readFileSync(new URL('../src/theatre/state.json', import.meta.url), 'utf8'))
const num = (v: number) => types.number(v)
const vec = (x = 0, y = 0, z = 0) => types.compound({ x: num(x), y: num(y), z: num(z) })
const proj = getProject(PROJECT, { state })
const sheet = proj.sheet(SHEET)
const objs: Record<string, any> = {
  Camera: sheet.object('Camera', { c: vec(), az: num(18), R: num(8.2), h: num(0.5), off: num(1.7), fov: num(30) }),
  Centerpiece: sheet.object('Centerpiece', { pos: vec(), rot: vec(8, 0, 0), scale: num(1) }),
  Stage: sheet.object('Stage', { core: num(1), rings: num(1), ringVis: num(1), mobius: num(0), lime: num(0), explode: num(0), oled: num(0), devScale: num(0.001), horizon: num(0) }),
  Device: sheet.object('Device', { pos: vec(0, -0.1, 0), rot: vec(8, -32, 0) }),
}
await proj.ready
const get = (o: string, path: string, t: number) => {
  sheet.sequence.position = t
  return path.split('.').reduce((a: any, k) => a[k], objs[o].value) as number
}
let fails = 0, checks = 0, maxNonLin = 0
for (const [o, props] of Object.entries(TRACKS)) for (const [path, s] of Object.entries(props)) {
  // 1) every authored waypoint is reproduced exactly
  for (const [t, v] of s.pts) { checks++; if (Math.abs(get(o, path, t) - v) > 1e-3) { fails++; console.log('WAYPOINT MISS', o, path, t, v, get(o, path, t)) } }
  // 2) between consecutive baked keys the engine returns the exact linear interpolation
  const id = state.sheetsById[SHEET].sequence.tracksByObject[o].trackIdByPropPath[JSON.stringify(path.split('.'))]
  const kfs = state.sheetsById[SHEET].sequence.tracksByObject[o].trackData[id].keyframes
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1]
    for (const f of [0.25, 0.5, 0.75]) {
      const t = a.position + (b.position - a.position) * f, want = a.value + (b.value - a.value) * f
      const got = get(o, path, t); checks++
      maxNonLin = Math.max(maxNonLin, Math.abs(got - want))
      if (Math.abs(got - want) > 1e-3) { fails++; console.log('NON-LINEAR', o, path, t, want, got) }
    }
  }
}
// 3) constant camera-azimuth speed inside each act (no random speed-ups, no reversals)
const acts = [[0, 14], [14, 28], [28, 44], [44, 58], [58, 70], [70, 84], [84, 100]]
for (const [a, b] of acts) {
  const speeds: number[] = []
  for (let t = a; t + 1 <= b; t += 1) speeds.push(get('Camera', 'az', t + 1) - get('Camera', 'az', t))
  const spread = Math.max(...speeds) - Math.min(...speeds)
  if (spread > 1e-3) { fails++; console.log('SPEED VARIES inside act', a, b) }
  console.log(`act ${a}-${b}: camera orbit ${speeds[0].toFixed(2)} deg per 1% scroll, constant (spread ${spread.toExponential(1)})`)
}
console.log(`checks ${checks}, failures ${fails}, max linear deviation ${maxNonLin.toExponential(2)}, sequence length ${SEQ_LEN}`)
process.exit(fails ? 1 : 0)
