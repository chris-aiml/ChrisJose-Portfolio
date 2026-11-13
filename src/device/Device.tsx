import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DV, SM, DEG, ACCENT, INK } from './store'
import { addRim } from './materials'
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
  g.fillStyle = 'rgba(255,244,224,.8)'; g.font = '600 34px "JetBrains Mono Variable", monospace'; g.textBaseline = 'middle'; g.fillText(HARDWARE.rev, 8, 34)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}

/** Illustrative concept of the air-quality monitoring device. Exploded along its axis: fan, mesh bands, sensor core, shell. */
export function Device({ onWarm }: { onWarm?: () => void }) {
  const root = useRef<THREE.Group>(null!)     // position, scale, tilt toward the viewer, slight yaw of the finished train
  const lay = useRef<THREE.Group>(null!)      // lays the device down into a train
  const spinG = useRef<THREE.Group>(null!)    // turns the device about its own axis
  const warm = useRef(0)
  const g = {
    fan: useRef<THREE.Group>(null!), meshU: useRef<THREE.Group>(null!), core: useRef<THREE.Group>(null!),
    shell: useRef<THREE.Group>(null!), glass: useRef<THREE.Group>(null!), handle: useRef<THREE.Group>(null!),
    meshL: useRef<THREE.Group>(null!), base: useRef<THREE.Group>(null!), lines: useRef<THREE.Group>(null!),
    blades: useRef<THREE.Group>(null!),
  }
  const wheelGroups = useRef<THREE.Group[]>([])
  const wheelMeshes = useRef<THREE.Mesh[]>([])
  const lamp = useRef<THREE.Mesh>(null!)
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
      wheel: new THREE.CylinderGeometry(0.2, 0.2, 0.12, 28).rotateX(Math.PI / 2),
      hubw: new THREE.CylinderGeometry(0.075, 0.075, 0.108, 16).rotateX(Math.PI / 2),
      lamp: new THREE.SphereGeometry(0.07, 16, 16),
    }
  }, [])
  const mats = useMemo(() => ({
    body: addRim(new THREE.MeshStandardMaterial({ color: '#4d4e52', metalness: 0.55, roughness: 0.48, side: THREE.DoubleSide }), 0.8, 0.9, 0.94),
    dark: addRim(new THREE.MeshStandardMaterial({ color: '#2f3033', metalness: 0.5, roughness: 0.5 }), 0.8, 0.9, 0.94),
    blade: new THREE.MeshStandardMaterial({ color: '#1b1c1e', metalness: 0.3, roughness: 0.55 }),
    band: new THREE.MeshStandardMaterial({ color: '#ffffff', map: mesh, bumpMap: mesh, bumpScale: 0.4, metalness: 0.5, roughness: 0.55, side: THREE.DoubleSide }),
    core: new THREE.MeshStandardMaterial({ color: '#17181b', metalness: 0.55, roughness: 0.4 }),
    lime: new THREE.MeshBasicMaterial({ color: ACCENT, toneMapped: false }),
    glass: new THREE.MeshPhysicalMaterial({ map: panel, transparent: true, alphaTest: 0.05, roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide }),
    rev: new THREE.MeshBasicMaterial({ map: rev, transparent: true, toneMapped: false }),
    leader: new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 }),
    tyre: new THREE.MeshStandardMaterial({ color: INK, metalness: 0.2, roughness: 0.6 }),
  }), [mesh, panel, rev])
  useEffect(() => () => { Object.values(geo).forEach((x) => x.dispose()); Object.values(mats).forEach((m) => m.dispose()); mesh.dispose(); panel.dispose(); rev.dispose() }, [])


  // train layout, front (top) to back, spaced so nothing overlaps
  const H = [0.38, 0.34, 1.2, 1.95, 0.34, 0.22], GAP = 0.22
  const trainY: number[] = []
  { let y = (H.reduce((a, b) => a + b, 0) + GAP * 5) / 2 - H[0] / 2; trainY.push(y); for (let i = 1; i < 6; i++) { y -= H[i - 1] / 2 + GAP + H[i] / 2; trainY.push(y) } }
  const WR = [0.9, 0.9, 0.52, 0.9, 0.9, 0.9]   // body radius under each carriage, for the wheels

  useFrame(({ viewport }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    // ease everything toward what the scroll asked for, so no input (wheel, jump, button) ever snaps the model
    const eT = Math.max(DV.e, DV.xp)
    if (SM.snap) { SM.e = eT; SM.tr = DV.tr; SM.scale = DV.scale; SM.spin = DV.spin; SM.x = DV.x; SM.y = DV.y; SM.roll = DV.roll; SM.shown = DV.shown; SM.snap = false }
    else {
      const d = THREE.MathUtils.damp
      SM.e = d(SM.e, eT, 5, dt); SM.tr = d(SM.tr, DV.tr, 7, dt); SM.scale = d(SM.scale, DV.scale, 8, dt)
      SM.spin = d(SM.spin, DV.spin, 6, dt); SM.x = d(SM.x, DV.x, 7, dt); SM.y = d(SM.y, DV.y, 7, dt)
      SM.roll = d(SM.roll, DV.roll, 7, dt); SM.shown = d(SM.shown, DV.shown, 10, dt)
    }
    const warming = warm.current < 3
    DV.warming = warming
    const e = THREE.MathUtils.clamp(SM.e, 0, 1), tr = THREE.MathUtils.clamp(SM.tr, 0, 1)
    root.current.visible = warming || SM.shown > 0.01
    if (!root.current.visible) return
    const k = 1 - tr
    const sTrain = Math.min(0.8, (viewport.width * 0.84) / 5.6)
    const sc = THREE.MathUtils.lerp(SM.scale * SM.shown * (1 - 0.17 * e), sTrain, tr)
    root.current.position.set(SM.x, SM.y, 0)
    root.current.rotation.set(8 * DEG * k, -12 * tr * DEG, 0)
    lay.current.rotation.z = -tr * 90 * DEG
    spinG.current.rotation.y = SM.spin * k * DEG
    root.current.scale.setScalar(warming ? 1e-4 : Math.max(sc, 1e-4))
    const L = (a: number, b: number) => THREE.MathUtils.lerp(a, b, tr)
    g.fan.current.position.y = L(1.51 + 2.2 * e, trainY[0])
    g.meshU.current.position.y = L(1.15 + 1.45 * e, trainY[1])
    g.core.current.position.y = L(0.85 * e, trainY[2])
    g.shell.current.position.y = L(-0.35 * e, trainY[3])
    g.handle.current.position.set(R - 0.12 + 0.6 * e, -0.35 * e, 0); g.handle.current.scale.setScalar(Math.max(0.001, k))
    g.glass.current.position.set(Math.sin(PANEL_ANGLE) * 0.95 * e, -0.35 * e, Math.cos(PANEL_ANGLE) * 0.95 * e); g.glass.current.scale.setScalar(Math.max(0.001, k))
    g.meshL.current.position.y = L(-1.15 - 1.25 * e, trainY[4])
    g.base.current.position.y = L(-1.44 - 1.85 * e, trainY[5])
    g.blades.current.rotation.y += dt * (1.2 + 3 * (1 - e))
    mats.leader.opacity = Math.min(1, e * 1.4) * 0.85 * k
    g.lines.current.visible = warming || (e > 0.01 && k > 0.02)
    // wheels grow out of each carriage as it becomes a train, and roll with the distance travelled (no skidding)
    const rot = -SM.roll / (0.2 * Math.max(sc, 0.05))
    wheelGroups.current.forEach((w, i) => { w.visible = warming || tr > 0.02; w.scale.setScalar(Math.max(0.001, tr)); w.position.set(WR[i] - 0.04, 0, 0) })
    wheelMeshes.current.forEach((m) => { m.rotation.z = rot })
    if (lamp.current) { lamp.current.visible = warming || tr > 0.4; lamp.current.scale.setScalar(Math.max(0.001, (tr - 0.4) / 0.6)) }
    if (warming && ++warm.current >= 3) onWarm?.()
  })

  const bladeN = 12
  const wheelsFor = (i: number) => (
    <group ref={(el) => { if (el) wheelGroups.current[i] = el }}>
      {[-0.52, 0.52].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh ref={(el) => { if (el) wheelMeshes.current[i * 2 + (z < 0 ? 0 : 1)] = el }} geometry={geo.wheel} material={mats.tyre} />
          <mesh geometry={geo.hubw} material={mats.lime} />
        </group>
      ))}
    </group>
  )
  return (
    <group ref={root}><group ref={lay}><group ref={spinG}>
      <group ref={g.base}>
        <mesh geometry={geo.baseBody} material={mats.dark} />
        <mesh position={[0, -0.02, R + 0.045]} rotation={[0, 0, 0]}><planeGeometry args={[0.62, 0.078]} /><primitive object={mats.rev} attach="material" /></mesh>
        {wheelsFor(5)}
      </group>
      <group ref={g.meshL}>
        <mesh geometry={geo.band} material={mats.band} />
        <mesh geometry={geo.bandRing} material={mats.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.17, 0]} />
        <mesh geometry={geo.bandRing} material={mats.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.17, 0]} />
        {wheelsFor(4)}
      </group>
      <group ref={g.shell}>
        <mesh geometry={geo.shell} material={mats.body} />
        {wheelsFor(3)}
      </group>
      <group ref={g.handle}><mesh geometry={geo.handle} material={mats.body} position={[0.17, 0, -0.15]} /></group>
      <group ref={g.glass}><mesh geometry={geo.glass} material={mats.glass} /></group>
      <group ref={g.core}>
        <mesh geometry={geo.core} material={mats.core} />
        <mesh geometry={geo.coreDisc} material={mats.dark} position={[0, 0.6, 0]} />
        <mesh geometry={geo.coreDisc} material={mats.dark} position={[0, -0.6, 0]} />
        <mesh geometry={geo.coreRing} material={mats.lime} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} />
        {[0, 1, 2, 3].map((i) => <mesh key={i} geometry={geo.chip} material={mats.dark} position={[Math.sin(i * 1.57 + 0.5) * 0.53, -0.25 + i * 0.12, Math.cos(i * 1.57 + 0.5) * 0.53]} rotation={[0, i * 1.57 + 0.5, 0]} />)}
        {wheelsFor(2)}
      </group>
      <group ref={g.meshU}>
        <mesh geometry={geo.band} material={mats.band} />
        <mesh geometry={geo.bandRing} material={mats.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.17, 0]} />
        <mesh geometry={geo.bandRing} material={mats.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.17, 0]} />
        {wheelsFor(1)}
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
        <mesh ref={lamp} geometry={geo.lamp} material={mats.lime} position={[0, 0.42, 0]} />
        {wheelsFor(0)}
      </group>
      <group ref={g.lines}>
        <lineSegments geometry={geo.line} material={mats.leader} />
        {[1.51 + 2.2, 1.15 + 1.45, 0.85, -0.35, -1.15 - 1.25, -1.44 - 1.85].map((y, i) => <mesh key={i} geometry={geo.dot} material={mats.lime} position={[0, y, 0]} />)}
      </group>
    </group></group></group>
  )
}
