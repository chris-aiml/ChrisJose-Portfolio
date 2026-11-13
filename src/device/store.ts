/** Mutable per-frame state for the 3D device. Written by the Hardware scene, read in useFrame, never in React render. */
export const DV = {
  e: 0,        // exploded amount from scroll 0..1
  xp: 0,       // exploded amount from the button, 0 or 1 (eased in the device, never snapped)
  tr: 0,       // morph into train carriages 0..1
  scale: 0.66, // device scale before the train
  spin: -32,   // yaw in degrees
  x: 0, y: -0.1,
  roll: 0,     // distance travelled by the train, in world units
  shown: 0,    // 0..1 visibility ramp
  warming: false, // true for the first frames after mount: everything is drawn once, invisibly, so shaders compile early
}
/** The same values after easing. The device and the track both draw from this, so a scroll jump or a button press never snaps. */
export const SM = { e: 0, tr: 0, scale: 0.66, spin: -32, x: 0, y: -0.1, roll: 0, shown: 0, snap: true }
export const ACCENT = '#FF7A9A'
export const INK = '#1B1224'
export const DEG = Math.PI / 180
if (typeof window !== 'undefined' && /[?&]debug/.test(window.location.search)) (window as unknown as { __sm: typeof SM }).__sm = SM
