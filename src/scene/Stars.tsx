import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LIME } from './store'

function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** Cancer: β (Al Tarf, the one slightly brighter star), δ, γ, α, ι. RA in hours, Dec in degrees. */
const CANCER: { n: string; ra: number; dec: number }[] = [
  { n: 'beta', ra: 8.275, dec: 9.19 },
  { n: 'delta', ra: 8.745, dec: 18.15 },
  { n: 'gamma', ra: 8.721, dec: 21.47 },
  { n: 'alpha', ra: 8.975, dec: 11.86 },
  { n: 'iota', ra: 8.778, dec: 28.76 },
]
const ROLL = 0.0
const LINES: [number, number][] = [[0, 1], [1, 2], [1, 3], [2, 4]]

const vert = /* glsl */ `
attribute float aSize; attribute float aPhase; attribute float aBright;
uniform float uTime; uniform float uPx; uniform float uSeed; uniform float uReveal;
varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.86 + 0.14 * sin(uTime * (0.35 + fract(aPhase * uSeed) * 0.5) + aPhase * 6.2831);
  vA = aBright * tw;
  gl_PointSize = max(1.0, aSize * uPx);
}`
const frag = /* glsl */ `
precision highp float;
varying float vA; uniform vec3 uTint;
void main(){
  vec2 p = gl_PointCoord - 0.5; float d = length(p);
  float a = smoothstep(0.5, 0.36, d);
  gl_FragColor = vec4(mix(vec3(0.957,0.957,0.941), uTint, 0.0), a * vA);
}`

export function Stars() {
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const lineMat = useRef<THREE.LineBasicMaterial>(null!)
  const built = useMemo(() => {
    const rnd = mulberry32(1307)
    const N = 1500, R = 70
    const pos: number[] = [], size: number[] = [], ph: number[] = [], br: number[] = []
    for (let i = 0; i < N; i++) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u)
      const rad = R * (0.85 + rnd() * 0.3)
      pos.push(Math.cos(a) * r * rad, u * rad, Math.sin(a) * r * rad)
      const k = rnd()
      size.push(k > 0.985 ? 2.4 : k > 0.9 ? 1.7 : 1.1)
      ph.push(rnd()); br.push(0.28 + rnd() * 0.5)
    }
    // Cancer, placed so it drifts through the upper-left of the final horizon view and the opening orbit
    const cr = 58
    const toVec = (ra: number, dec: number) => {
      const a = (ra / 24) * Math.PI * 2, d = (dec * Math.PI) / 180
      return new THREE.Vector3(Math.cos(d) * Math.cos(a), Math.sin(d), Math.cos(d) * Math.sin(a))
    }
    const cen = new THREE.Vector3()
    CANCER.forEach((c) => cen.add(toVec(c.ra, c.dec)))
    cen.normalize()
    // Placed in the sky just right of the final camera heading (az 395°), a few degrees above the horizon,
    // so it drifts into the empty right half of the frame as the horizon act arrives.
    const th = (35 * Math.PI) / 180, ang = (13 * Math.PI) / 180, el = (6.5 * Math.PI) / 180
    const fwd = new THREE.Vector3(-Math.sin(th), 0, -Math.cos(th)), rgt = new THREE.Vector3(Math.cos(th), 0, -Math.sin(th))
    const target = fwd.clone().multiplyScalar(Math.cos(ang)).addScaledVector(rgt, Math.sin(ang)).multiplyScalar(Math.cos(el))
    target.y = Math.sin(el); target.normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(cen, target)
    const cp = CANCER.map((c) => {
      const p = toVec(c.ra, c.dec).applyQuaternion(q).applyAxisAngle(target, ROLL)
      return p.sub(target).multiplyScalar(0.46).add(target).normalize().multiplyScalar(cr)
    })
    cp.forEach((p, i) => { pos.push(p.x, p.y, p.z); size.push(i === 0 ? 3.8 : 2.6); ph.push(0.5 + i * 0.07); br.push(i === 0 ? 1.0 : 0.7) })
    const lp: number[] = []
    LINES.forEach(([a, b]) => { lp.push(cp[a].x, cp[a].y, cp[a].z, cp[b].x, cp[b].y, cp[b].z) })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1))
    g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph, 1))
    g.setAttribute('aBright', new THREE.Float32BufferAttribute(br, 1))
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3))
    return { g, lg }
  }, [])
  useEffect(() => () => { built.g.dispose(); built.lg.dispose() }, [built])

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPx: { value: 1 }, uSeed: { value: 13.07 }, uReveal: { value: 1 }, uTint: { value: new THREE.Color(LIME) } }), [])
  useFrame(({ clock, gl }) => { uniforms.uTime.value = clock.elapsedTime; uniforms.uPx.value = gl.getPixelRatio() })
  return (
    <group>
      <points geometry={built.g} frustumCulled={false}>
        <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent depthWrite={false} />
      </points>
      <lineSegments geometry={built.lg} frustumCulled={false}>
        <lineBasicMaterial ref={lineMat} color="#F4F4F0" transparent opacity={0.13} depthWrite={false} />
      </lineSegments>
    </group>
  )
}
