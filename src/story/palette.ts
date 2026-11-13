/** Colours shared by canvas and WebGL code. The same values live in styles/base.css as CSS variables. */
export const C = {
  night: '#1C1325',
  night2: '#2A1B37',
  plum: '#46284F',
  paper: '#F3EBDD',
  ink: '#1B1224',
  butter: '#FFD54A',
  rose: '#FF7A9A',
  mint: '#9BE3C4',
}
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const sm = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t) }
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3)
export const easeInOut = (t: number) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
export const rnd = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
