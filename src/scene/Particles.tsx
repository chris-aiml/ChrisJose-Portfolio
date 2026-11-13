import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bandPoint } from './band'
import { S } from './store'

function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

const V = /* glsl */ `
attribute vec3 aB; attribute vec4 aR; // aR: size, delay, phase, lime
uniform float uMorph, uTime, uScale, uObj;
varying float vA; varying float vLime;
vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
void main(){
  float size = aR.x, delay = aR.y, ph = aR.z;
  // gathering state: a dense, slowly shearing cloud (core turns faster than the rim)
  float r = length(position);
  vec3 a = rotY(position, uTime * 0.16 / (0.6 + r));
  a += 0.045 * vec3(sin(uTime*.6 + ph*40.0), cos(uTime*.5 + ph*23.0), sin(uTime*.7 + ph*31.0));
  // each particle leaves at its own moment and arcs onto the ribbon
  float m = smoothstep(delay * 0.55, delay * 0.55 + 0.45, uMorph);
  vec3 b = aB + 0.012 * vec3(sin(uTime*1.3 + ph*50.0), cos(uTime*1.1 + ph*17.0), sin(uTime*.9 + ph*29.0));
  vec3 arc = vec3(sin(ph*91.0), cos(ph*57.0), sin(ph*33.0)) * sin(m * 3.14159) * 0.9;
  vec3 p = mix(a, b, m) + arc;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, size * uObj * uScale / -mv.z);
  float tw = 0.65 + 0.35 * sin(uTime * (0.8 + ph * 2.0) + ph * 60.0);
  vA = tw * mix(0.55, 0.9, m); vLime = aR.w;
}`
const F = /* glsl */ `
precision highp float; varying float vA; varying float vLime;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  vec3 c = mix(vec3(0.96, 0.96, 0.93), vec3(0.824, 1.0, 0.0), vLime);
  gl_FragColor = vec4(c, a * vA * 0.62);
}`

/** Gathering state: a fine, shearing particle cloud. Leadership act: the cloud streams onto the infinity ribbon. */
export function Particles() {
  const geo = useMemo(() => {
    const N = 46000, rnd = rng(1307)
    const P = new Float32Array(N * 3), B = new Float32Array(N * 3), R = new Float32Array(N * 4)
    const v = new THREE.Vector3()
    for (let i = 0; i < N; i++) {
      // a three-armed spiral disc, tilted toward the camera: dense bright core, thin drifting arms
      const r = 1.75 * Math.pow(rnd(), 0.72), arm = Math.floor(rnd() * 3), g = (rnd() + rnd() + rnd() - 1.5) / 1.5
      const th = arm * 2.0944 + r * 2.5 + g * 0.55 / (0.35 + r)
      const x0 = r * Math.cos(th), z0 = r * Math.sin(th), y0 = (rnd() + rnd() - 1) * 0.09 * (1.5 - r * 0.6) + g * 0.03
      // tilt about X (0.95) and Z (0.18)
      const cx = Math.cos(0.95), sx = Math.sin(0.95), y1 = y0 * cx - z0 * sx, z1 = y0 * sx + z0 * cx
      const cz = Math.cos(0.18), sz = Math.sin(0.18)
      P[i * 3] = x0 * cz - y1 * sz; P[i * 3 + 1] = x0 * sz + y1 * cz; P[i * 3 + 2] = z1
      bandPoint('mobius', rnd() * Math.PI * 2, (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.05, v)
      B[i * 3] = v.x; B[i * 3 + 1] = v.y; B[i * 3 + 2] = v.z
      const lime = rnd() < 0.07 ? 1 : 0
      R[i * 4] = (0.0062 + rnd() * rnd() * 0.014) * (lime ? 1.3 : 1); R[i * 4 + 1] = rnd(); R[i * 4 + 2] = rnd(); R[i * 4 + 3] = lime
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aB', new THREE.BufferAttribute(B, 3)); g.setAttribute('aR', new THREE.BufferAttribute(R, 4))
    return g
  }, [])
  const uni = useMemo(() => ({ uMorph: { value: 0 }, uTime: { value: 0 }, uScale: { value: 1600 }, uObj: { value: 1 } }), [])
  useEffect(() => () => geo.dispose(), [geo])
  useFrame(({ clock, gl, camera }) => {
    const cam = camera as THREE.PerspectiveCamera
    uni.uTime.value = clock.elapsedTime
    uni.uMorph.value = THREE.MathUtils.clamp(S.stage.mobius, 0, 1)
    uni.uObj.value = Math.max(S.center.scale, 0.0001) * 0.8
    uni.uScale.value = gl.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan((cam.fov * Math.PI) / 360))
  })
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial vertexShader={V} fragmentShader={F} uniforms={uni} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}
