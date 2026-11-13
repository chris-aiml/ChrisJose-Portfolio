import * as THREE from 'three'

/**
 * Procedural product-photography studio, no HDR download: a dark room with softboxes,
 * a vertical strip, a top light and one hairline of lime behind the subject (the source of the
 * thin #D2FF00 reflections on titanium edges). Rendered once into a PMREM environment map.
 */
export function buildStudioEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  const env = new THREE.Scene()
  env.background = new THREE.Color(0x0b0c0e)
  const panel = (w: number, h: number, color: string | number, k: number, pos: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }),
    )
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m)
  }
  panel(9, 6, 0xffffff, 9, [-6, 6, 5])            // key softbox, upper left / front
  panel(1.3, 10, 0xeaf2ff, 6.5, [7.5, 1.5, 2.5])  // vertical strip, right
  panel(10, 10, 0xffffff, 2.6, [0, 9, 0.5])       // top
  panel(12, 0.55, 0xd2ff00, 5.5, [-1, 1.2, -8])   // lime hairline, behind
  panel(4, 6, 0xffe9d0, 1.4, [-8, -1, -2])        // warm low fill
  panel(24, 24, 0x2a2c31, 1.2, [0, -6, 0])        // floor bounce
  panel(7, 5, 0xffffff, 2.2, [3, 2.5, 9])         // soft front fill (reads on facets facing the lens)
  panel(1.1, 9, 0xffffff, 5, [-9, 0.5, -3])        // back-left strip
  panel(8, 3, 0xdfe8ff, 3.2, [0, -2.5, 8])        // low front bounce
  const pm = new THREE.PMREMGenerator(renderer)
  const rt = pm.fromScene(env, 0.03)
  pm.dispose()
  env.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose() } })
  return rt.texture
}
