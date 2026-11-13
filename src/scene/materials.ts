import * as THREE from 'three'

export const LIME_COLOR = new THREE.Color('#D2FF00')

/** Horizontal streaks → brushed-metal roughness/bump. Rows vary across the band, so streaks run along it. */
export function brushedTexture(repeatX = 24) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256
  const g = c.getContext('2d')!
  let seed = 1307
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  for (let y = 0; y < 256; y++) {
    const v = 120 + Math.floor(rnd() * 56)
    g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, 128, 1)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeatX, 1)
  t.colorSpace = THREE.NoColorSpace
  t.anisotropy = 4
  return t
}

export interface BandUniforms { uLo: { value: number }; uHi: { value: number }; uRim: { value: number } }

/**
 * Brushed titanium with (a) a window on the band's length for the draw-on / withdraw morph and
 * (b) a razor-thin lime Fresnel rim. The rim uses a tight smoothstep so it reads as an edge
 * highlight, never as a glow.
 */
export function titaniumMaterial(brush: THREE.Texture, opts: { windowed?: boolean; rim?: number } = {}) {
  const uniforms: BandUniforms = { uLo: { value: 0 }, uHi: { value: 1 }, uRim: { value: opts.rim ?? 0.85 } }
  const m = new THREE.MeshPhysicalMaterial({
    color: 0x9a9a97, metalness: 1, roughness: 0.55, roughnessMap: brush,
    bumpMap: brush, bumpScale: 0.35, side: THREE.DoubleSide, envMapIntensity: 1.15,
  })
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLo = uniforms.uLo; sh.uniforms.uHi = uniforms.uHi; sh.uniforms.uRim = uniforms.uRim
    sh.uniforms.uLime = { value: LIME_COLOR }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aU;\nvarying float vU;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvU = aU;')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vU;\nuniform float uLo;\nuniform float uHi;\nuniform float uRim;\nuniform vec3 uLime;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${opts.windowed ? 'if (vU < uLo || vU > uHi) discard;' : ''}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float rimF = 1.0 - saturate(abs(dot(normalize(vViewPosition), normal)));
        totalEmissiveRadiance += uLime * smoothstep(0.915, 0.955, rimF) * uRim;`)
  }
  m.customProgramCacheKey = () => 'cj-titanium-' + (opts.windowed ? 'w' : 's')
  return { material: m, uniforms }
}

/** Add the same razor-thin lime Fresnel edge to any standard/physical material. */
export function addLimeRim(m: THREE.MeshStandardMaterial, strength = 0.8, lo = 0.9, hi = 0.94) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLime = { value: LIME_COLOR }
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uLime;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float rimF = 1.0 - saturate(abs(dot(normalize(vViewPosition), normal)));
        totalEmissiveRadiance += uLime * smoothstep(${lo.toFixed(2)}, ${hi.toFixed(2)}, rimF) * ${strength.toFixed(2)};`)
  }
  m.customProgramCacheKey = () => `cj-rim-${strength}-${lo}-${hi}`
  return m
}
