/** Mutable per-frame state shared by scene components (read in useFrame, never in React render). */
export const S = {
  cam: { c: { x: 0, y: 0, z: 0 }, az: 18, R: 8.2, h: 0.5, off: 1.7, fov: 30 },
  center: { pos: { x: 0, y: 0, z: 0 }, rot: { x: 8, y: 0, z: 0 }, scale: 1 },
  stage: { core: 1, rings: 1, ringVis: 1, mobius: 0, lime: 0, explode: 0, oled: 0, devScale: 0.001, horizon: 0 },
  device: { pos: { x: 0, y: -0.1, z: 0 }, rot: { x: 8, y: -32, z: 0 } },
  pointer: { x: 0, y: 0, sx: 0, sy: 0 },
  /** manual "Exploded view" toggle, damped */
  manual: { target: 0, value: 0 },
}
export const LIME = '#D2FF00'
export const CARBON = '#111214'
export const BONE = '#F4F4F0'
export const DEG = Math.PI / 180
