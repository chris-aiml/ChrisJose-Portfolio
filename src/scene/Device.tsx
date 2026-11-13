import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S, DEG, LIME } from './store'
import { addLimeRim } from './materials'
import { HARDWARE } from '../content'

const R = 0.9
const PANEL_ANGLE = -0.42 // radians around the shell, display faces slightly left of the viewer

function rrect<T extends THREE.Path>(w: number, h: number, r: number, s: T): T {
  const x = -w / 2, y = -h / 2
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}

function meshTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#9b9ca0'; g.fillRect(0, 0, 128, 64)
  g.strokeStyle = 'rgba(30,31,34,.55)'; g.lineWidth = 1.4
  for (let i = -64; i < 192; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke() }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 1.5); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}
/** Rounded black display with one small red status LED. No clock face. */
function panelTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512
  const g = c.getContext('2d')!
  g.clearRect(0, 0, 256, 512)
  const r = 34, x = 4, y = 4, w = 248, h = 504
  g.fillStyle = '#050506'; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill()
  g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 3; g.stroke()
  g.fillStyle = '#ff3b30'; g.beginPath(); g.arc(46, 438, 11, 0, Math.PI * 2); g.fill()
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t
}
function revTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = 'rgba(244,244,240,.8)'; g.font = '600 34px "JetBrains Mono Variable", monospace'; g.textBaseline = 'middle'; g.fillText(HARDWARE.rev, 8, 34)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}

/** Illustrative concept of the air-quality monitoring device. Exploded along its axis: fan, mesh bands, sensor core, shell. */
export function Device() {
  const root = useRef<THREE.Group>(null!)
  const g = {
    fan: useRef<THREE.Group>(null!), meshU: useRef<THREE.Group>(null!), core: useRef<THREE.Group>(null!),
    shell: useRef<THREE.Group>(null!), glass: useRef<THREE.Group>(null!), handle: useRef<THREE.Group>(null!),
    meshL: useRef<THREE.Group>(null!), base: useRef<THREE.Group>(null!), lines: useRef<THREE.Group>(null!),
    blades: useRef<THREE.Group>(null!),
  }
  const mesh = useMemo(meshTexture, [])
  const panel = useMemo(panelTexture, [])
  const rev = useMemo(revTexture, [])

  const geo = useMemo(() => {
    const bladeGeo = new THREE.BoxGeometry(0.34, 0.012, 0.11)
    const handleShape = rrect(0.56, 1.95, 0.24, new THREE.Shape()); handleShape.holes.push(rrect(0.3, 1.56, 0.14, new THREE.Path()))
    return {
      shell: new THREE.CylinderGeometry(R, R, 1.95, 64, 1, true),
      shellCap: new THREE.RingGeometry(R - 0.05, R, 64),
      band: new THREE.CylinderGeometry(R + 0.02, R + 0.02, 0.34, 64, 1, true),
      bandRing: new THREE.TorusGeometry(R + 0.02, 0.022, 10, 80),
      fanBody: new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.38, 64),
      fanWell: new THREE.CylinderGeometry(R - 0.1, R - 0.1, 0.02, 64),
      hub: new THREE.CylinderGeometry(0.17, 0.17, 0.09, 32),
      blade: bladeGeo,
      baseBody: new THREE.CylinderGeometry(R + 0.04, R + 0.01, 0.22, 64),
      core: new THREE.CylinderGeometry(0.52, 0.52, 1.2, 40),
      coreRing: new THREE.TorusGeometry(0.56, 0.014, 8, 64),
      coreDisc: new THREE.CylinderGeometry(0.62, 0.62, 0.04, 48),
      chip: new THREE.BoxGeometry(0.2, 0.2, 0.05),
      glass: new THREE.CylinderGeometry(R + 0.014, R + 0.014, 1.14, 40, 1, true, PANEL_ANGLE - 0.62, 1.24),
      handle: new THREE.ExtrudeGeometry(handleShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4, curveSegments: 20 }),
      line: new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -4.2, 0), new THREE.Vector3(0, 4.6, 0)]),
      dot: new THREE.SphereGeometry(0.035, 12, 12),
    }
  }, [])
  const mats = useMemo(() => ({
    body: addLimeRim(new THREE.MeshStandardMaterial({ color: '#4d4e52', metalness: 0.55, roughness: 0.48, side: THREE.DoubleSide }), 0.8, 0.9, 0.94),
    dark: addLimeRim(new THREE.MeshStandardMaterial({ color: '#2f3033', metalness: 0.5, roughness: 0.5 }), 0.8, 0.9, 0.94),
    blade: new THREE.MeshStandardMaterial({ color: '#1b1c1e', metalness: 0.3, roughness: 0.55 }),
    band: new THREE.MeshStandardMaterial({ color: '#ffffff', map: mesh, bumpMap: mesh, bumpScale: 0.4, metalness: 0.5, roughness: 0.55, side: THREE.DoubleSide }),
    core: new THREE.MeshStandardMaterial({ color: '#17181b', metalness: 0.55, roughness: 0.4 }),
    lime: new THREE.MeshBasicMaterial({ color: LIME, toneMapped: false }),
    glass: new THREE.MeshPhysicalMaterial({ map: panel, transparent: true, alphaTest: 0.05, roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide }),
    rev: new THREE.MeshBasicMaterial({ map: rev, transparent: true, toneMapped: false }),
    leader: new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0 }),
  }), [mesh, panel, rev])
  useEffect(() => () => { Object.values(geo).forEach((x) => x.dispose()); Object.values(mats).forEach((m) => m.dispose()); mesh.dispose(); panel.dispose(); rev.dispose() }, [])

  useFrame(({ clock }, dt) => {
    const { pos, rot } = S.device, st = S.stage, sc = st.devScale
    root.current.visible = sc > 0.01
    if (!root.current.visible) return
    const e = THREE.MathUtils.clamp(Math.max(st.explode, S.manual.value), 0, 1)
    root.current.position.set(pos.x, pos.y, pos.z)
    root.current.rotation.set(rot.x * DEG, rot.y * DEG, rot.z * DEG)
    root.current.scale.setScalar(sc * (0.66 - 0.17 * e))
    g.fan.current.position.y = 1.51 + 2.2 * e
    g.meshU.current.position.y = 1.15 + 1.45 * e
    g.core.current.position.y = 0.0 + 0.85 * e
    g.shell.current.position.y = -0.35 * e
    g.handle.current.position.set(R - 0.12 + 0.6 * e, -0.35 * e, 0)
    g.glass.current.position.set(Math.sin(PANEL_ANGLE) * 0.95 * e, -0.35 * e, Math.cos(PANEL_ANGLE) * 0.95 * e)
    g.meshL.current.position.y = -1.15 - 1.25 * e
    g.base.current.position.y = -1.44 - 1.85 * e
    g.blades.current.rotation.y += dt * (1.2 + 3 * (1 - e))
    mats.leader.opacity = Math.min(1, e * 1.4) * 0.85
    g.lines.current.visible = e > 0.01
    void clock
  })

  const bladeN = 12
  return (
    <group ref={root}>
      <group ref={g.base}>
        <mesh geometry={geo.baseBody} material={mats.dark} />
        <mesh position={[0, -0.02, R + 0.045]} rotation={[0, 0, 0]}><planeGeometry args={[0.62, 0.078]} /><primitive object={mats.rev} attach="material" /></mesh>
      </group>
      <group ref={g.meshL}>
        <mesh geometry={geo.band} material={mats.band} />
        <mesh geometry={geo.bandRing} material={mats.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.17, 0]} />
        <mesh geometry={geo.bandRing} material={mats.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.17, 0]} />
      </group>
      <group ref={g.shell}>
        <mesh geometry={geo.shell} material={mats.body} />
      </group>
      <group ref={g.handle}><mesh geometry={geo.handle} material={mats.body} position={[0.17, 0, -0.15]} /></group>
      <group ref={g.glass}><mesh geometry={geo.glass} material={mats.glass} /></group>
      <group ref={g.core}>
        <mesh geometry={geo.core} material={mats.core} />
        <mesh geometry={geo.coreDisc} material={mats.dark} position={[0, 0.6, 0]} />
        <mesh geometry={geo.coreDisc} material={mats.dark} position={[0, -0.6, 0]} />
        <mesh geometry={geo.coreRing} material={mats.lime} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} />
        {[0, 1, 2, 3].map((i) => <mesh key={i} geometry={geo.chip} material={mats.dark} position={[Math.sin(i * 1.57 + 0.5) * 0.53, -0.25 + i * 0.12, Math.cos(i * 1.57 + 0.5) * 0.53]} rotation={[0, i * 1.57 + 0.5, 0]} />)}
      </group>
      <group ref={g.meshU}>
        <mesh geometry={geo.band} material={mats.band} />
        <mesh geometry={geo.bandRing} material={mats.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.17, 0]} />
        <mesh geometry={geo.bandRing} material={mats.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.17, 0]} />
      </group>
      <group ref={g.fan}>
        <mesh geometry={geo.fanBody} material={mats.dark} />
        <mesh geometry={geo.fanWell} material={mats.blade} position={[0, 0.185, 0]} />
        <mesh geometry={geo.hub} material={mats.body} position={[0, 0.21, 0]} />
        <group ref={g.blades} position={[0, 0.2, 0]}>
          {Array.from({ length: bladeN }).map((_, i) => (
            <group key={i} rotation={[0, (i / bladeN) * Math.PI * 2, 0]}>
              <mesh geometry={geo.blade} material={mats.blade} position={[0.44, 0, 0]} rotation={[0.5, 0, 0]} />
            </group>
          ))}
        </group>
      </group>
      <group ref={g.lines}>
        <lineSegments geometry={geo.line} material={mats.leader} />
        {[1.51 + 2.2, 1.15 + 1.45, 0.85, -0.35, -1.15 - 1.25, -1.44 - 1.85].map((y, i) => <mesh key={i} geometry={geo.dot} material={mats.lime} position={[0, y, 0]} />)}
      </group>
    </group>
  )
}
