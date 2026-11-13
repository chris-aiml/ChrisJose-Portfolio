/**
 * Timeline authoring table. Positions are in sheet units (0..100 == normalised scroll 0..1).
 * `smooth` series are sampled through a monotone cubic (no overshoot) and baked into dense
 * LINEAR keyframes; `linear` series keep their waypoints as-is. Either way every keyframe
 * segment uses diagonal bezier handles, i.e. constant velocity between keys.
 *
 * Acts (normalised): 01 INTRO 0–.14 · 02 ABOUT .14–.28 · 03 LEADERSHIP .28–.44 · 04 PLIX .44–.58
 *                    05 LUCEN .58–.70 · 06 HARDWARE .70–.84 · 07–09 FINAL .84–1.00
 */
export const SEQ_LEN = 100
export const SHEET = 'Scroll'
export const PROJECT = 'CJ-1307'
export const STEP = 0.5

export interface Series { mode: 'smooth' | 'linear'; pts: [number, number][] }
export const smooth = (pts: [number, number][]): Series => ({ mode: 'smooth', pts }) // available, unused: scroll tracks stay linear
const L = (pts: [number, number][]): Series => ({ mode: 'linear', pts })

export const TRACKS: Record<string, Record<string, Series>> = {
  /**
   * Orbit camera: centre c, azimuth az (deg, monotone, never reverses), radius R, height h,
   * screen offset off (world units, + pushes the subject right), fov.
   * Waypoints sit on act boundaries so each act has ONE constant speed.
   */
  Camera: {
    'c.y': L([[0, 0], [70, 0], [84, 0.2], [89, 1.2], [100, 1.9]]),
    az: L([[0, 18], [14, 105], [28, 147], [44, 237], [58, 285], [70, 330], [84, 380], [100, 395]]),
    R: L([[0, 8.2], [14, 7.3], [28, 7.6], [44, 7.0], [58, 11.5], [70, 9.0], [84, 8.0], [100, 11.0]]),
    h: L([[0, 0.5], [14, 1.0], [28, 0.8], [44, 0.4], [58, 0.8], [70, 1.0], [84, 1.2], [100, 0.5]]),
    off: L([[0, 1.7], [14, 2.2], [28, 2.4], [44, 1.9], [86, 1.7], [91, 0], [100, 0]]),
    fov: L([[0, 30], [44, 30], [58, 34], [84, 30], [100, 30]]),
  },
  /** glass + titanium sculpture, which becomes the Möbius / infinity band */
  Centerpiece: {
    'pos.x': L([[0, 0], [44, 0], [52, 5.8], [58, 5.8], [65, -5.4], [70, -5.4]]),
    'pos.y': L([[0, 0], [44, 0], [52, 3.4], [58, 3.4], [65, 2.6], [70, 2.6]]),
    'pos.z': L([[0, 0], [44, 0], [52, -9], [58, -9], [65, -7.5], [70, -7.5]]),
    scale: L([[0, 1], [14, 1], [21, 0.78], [28, 0.78], [35, 0.62], [44, 0.5], [46, 0.001]]),
    'rot.x': L([[0, 8], [28, 14], [44, 18], [70, 10]]),
    'rot.y': L([[0, 0], [14, 50], [28, 130], [44, 520], [58, 610], [70, 670]]),
    'rot.z': L([[0, 0], [44, 8], [70, 0]]),
  },
  /** scalar stage props */
  Stage: {
    core: L([[0, 1], [29, 1], [36, 0]]),
    rings: L([[0, 1], [28, 1], [34, 0]]),
    ringVis: L([[0, 1], [29, 1], [35, 0]]),
    mobius: L([[0, 0], [29, 0], [38, 1]]),
    lime: L([[0, 0], [28, 0], [44, 1]]),
    explode: L([[0, 0], [73, 0], [78.5, 1], [100, 1]]),
    oled: L([[0, 0], [69, 0], [72, 1], [100, 1]]),
    devScale: L([[0, 0.001], [69.5, 0.001], [71.5, 1], [80, 1], [82.5, 0.001]]),
    horizon: L([[0, 0], [84, 0], [91, 1], [100, 1]]),
  },
  Device: {
    'rot.x': L([[0, 6], [70, 6], [78.5, 10], [100, 10]]),
    'rot.y': L([[0, -28], [70, -28], [78.5, 24], [100, 24]]),
  },
}
