import { getProject, types } from '@theatre/core'
import state from './state.json'
import { PROJECT, SHEET } from './acts'

const num = (v: number) => types.number(v)
const vec = (x = 0, y = 0, z = 0) => types.compound({ x: num(x), y: num(y), z: num(z) })

/**
 * The project runs from the exported static state (state.json). Nothing in this module
 * imports @theatre/studio, so production builds contain zero studio code.
 */
export const project = getProject(PROJECT, { state: state as never })
export const sheet = project.sheet(SHEET)

export const cameraObj = sheet.object('Camera', {
  c: vec(0, 0, 0), az: num(18), R: num(8.2), h: num(0.5), off: num(1.7), fov: num(30),
})
export const centerObj = sheet.object('Centerpiece', { pos: vec(), rot: vec(8, 0, 0), scale: num(1) })
export const stageObj = sheet.object('Stage', {
  core: num(1), rings: num(1), ringVis: num(1), mobius: num(0), lime: num(0),
  explode: num(0), oled: num(0), devScale: num(0.001), horizon: num(0),
})
export const deviceObj = sheet.object('Device', { pos: vec(0, -0.1, 0), rot: vec(8, -32, 0) })

/** Dev only: `npm run dev` + `?studio` opens Theatre Studio. Dead-code-eliminated in production. */
export function maybeInitStudio() {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('studio')) {
    void import('@theatre/studio').then(async ({ default: studio }) => {
      studio.initialize()
      const ext = await import('@theatre/r3f/dist/extension')
      studio.extend(ext.default)
    })
  }
}
