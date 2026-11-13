import * as THREE from 'three'

const TAU = Math.PI * 2
export type BandKind = 'ring' | 'mobius'

const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)

/** Centre line c(u) for each kind. */
function centre(kind: BandKind, u: number, out: THREE.Vector3) {
  if (kind === 'ring') return out.set(1.5 * Math.cos(u), 1.5 * Math.sin(u), 0)
  // figure-eight (lemniscate of Bernoulli) lifted in z so the two strands pass over/under at the crossing
  const a = 1.95, s = Math.sin(u), den = 1 + s * s
  return out.set((a * Math.cos(u)) / den, (a * s * Math.cos(u)) / den, 0.34 * Math.sin(u))
}

const _a = v(), _b = v(), _T = v(), _V = v(), _B = v()
/** Orthonormal frame (T tangent, W width direction, N thickness direction) at u. */
function frame(kind: BandKind, u: number, c: THREE.Vector3, T: THREE.Vector3, W: THREE.Vector3, N: THREE.Vector3) {
  const e = 1e-3
  centre(kind, u, c)
  centre(kind, u + e, _a); centre(kind, u - e, _b)
  T.copy(_a).sub(_b).normalize()
  if (kind === 'ring') {
    W.set(0, 0, 1).addScaledVector(T, -T.z).normalize() // bracelet: width along the axis
  } else {
    // base width = in-plane normal; rotating it by u/2 about T over one lap = a half twist (Möbius)
    _V.set(-T.y, T.x, 0).normalize()          // in-plane normal
    _B.crossVectors(T, _V).normalize()         // out-of-plane
    const th = u / 2
    W.copy(_V).multiplyScalar(Math.cos(th)).addScaledVector(_B, Math.sin(th)).normalize()
  }
  N.crossVectors(T, W).normalize()
}

export interface BandResult { geometry: THREE.BufferGeometry; edge: THREE.CatmullRomCurve3 | null }

export function buildBand(kind: BandKind, segs: number, w: number, t: number): BandResult {
  const c = v(), T = v(), W = v(), N = v()
  // four faces: [corner A (w,t), corner B (w,t), normal selector]
  const faces: { a: [number, number]; b: [number, number]; n: 'N' | '-N' | 'W' | '-W' }[] = [
    { a: [-w / 2, t / 2], b: [w / 2, t / 2], n: 'N' },
    { a: [w / 2, -t / 2], b: [-w / 2, -t / 2], n: '-N' },
    { a: [w / 2, t / 2], b: [w / 2, -t / 2], n: 'W' },
    { a: [-w / 2, -t / 2], b: [-w / 2, t / 2], n: '-W' },
  ]
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], au: number[] = [], idx: number[] = []
  let base = 0
  for (const f of faces) {
    for (let i = 0; i <= segs; i++) {
      const u = (i / segs) * TAU
      frame(kind, u, c, T, W, N)
      const nn = f.n === 'N' ? N : f.n === '-N' ? v().copy(N).negate() : f.n === 'W' ? W : v().copy(W).negate()
      for (let k = 0; k < 2; k++) {
        const [cw, ct] = k === 0 ? f.a : f.b
        pos.push(c.x + W.x * cw + N.x * ct, c.y + W.y * cw + N.y * ct, c.z + W.z * cw + N.z * ct)
        nor.push(nn.x, nn.y, nn.z)
        uv.push((i / segs) * 24, k)
        au.push(i / segs)
      }
    }
    // winding: make (b-a) x (next-a) agree with the face normal
    frame(kind, 0, c, T, W, N)
    const e = v(); e.copy(W).multiplyScalar(f.b[0] - f.a[0]).addScaledVector(N, f.b[1] - f.a[1])
    const cr = v().crossVectors(e, T)
    const nn = f.n === 'N' ? N : f.n === '-N' ? v().copy(N).negate() : f.n === 'W' ? W : v().copy(W).negate()
    const flip = cr.dot(nn) < 0
    for (let i = 0; i < segs; i++) {
      const a = base + i * 2, b = a + 1, c2 = a + 2, d = a + 3
      if (flip) idx.push(a, c2, b, b, c2, d); else idx.push(a, b, c2, b, d, c2)
    }
    base += (segs + 1) * 2
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('aU', new THREE.Float32BufferAttribute(au, 1))
  g.setIndex(idx)
  g.computeBoundingSphere()

  let edge: THREE.CatmullRomCurve3 | null = null
  if (kind === 'mobius') {
    // the single edge of a Möbius band closes after TWO laps
    const pts: THREE.Vector3[] = []
    const n = 720
    for (let i = 0; i < n; i++) {
      const u = (i / n) * TAU * 2
      frame(kind, u, c, T, W, N)
      pts.push(v(c.x + W.x * (w / 2) + N.x * (t / 2) * 1.2, c.y + W.y * (w / 2) + N.y * (t / 2) * 1.2, c.z + W.z * (w / 2) + N.z * (t / 2) * 1.2))
    }
    edge = new THREE.CatmullRomCurve3(pts, true, 'centripetal')
  }
  return { geometry: g, edge }
}

/** A point on the band surface: centre line at u, offset across the width (wOff) and through the thickness (nOff). */
export function bandPoint(kind: BandKind, u: number, wOff: number, nOff: number, out: THREE.Vector3) {
  const c = v(), T = v(), W = v(), N = v()
  frame(kind, u, c, T, W, N)
  return out.set(c.x + W.x * wOff + N.x * nOff, c.y + W.y * wOff + N.y * nOff, c.z + W.z * wOff + N.z * nOff)
}
