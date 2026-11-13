import * as THREE from 'three'
import { ACCENT } from './store'

export const ACCENT_COLOR = new THREE.Color(ACCENT)

/** A razor-thin accent Fresnel edge on any standard/physical material. */
export function addRim(m: THREE.MeshStandardMaterial, strength = 0.8, lo = 0.9, hi = 0.94) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uAcc = { value: ACCENT_COLOR }
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uAcc;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float rimF = 1.0 - saturate(abs(dot(normalize(vViewPosition), normal)));
        totalEmissiveRadiance += uAcc * smoothstep(${lo.toFixed(2)}, ${hi.toFixed(2)}, rimF) * ${strength.toFixed(2)};`)
  }
  m.customProgramCacheKey = () => `cj-rim-${strength}-${lo}-${hi}`
  return m
}
