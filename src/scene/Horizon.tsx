import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S, LIME, CARBON } from './store'

const FLOOR_Y = -3.2

/** Final act: a calm, flat horizon. Floor grid fades into the canvas colour; one lime hairline at the edge. */
export function Horizon() {
  const g = useRef<THREE.Group>(null!)
  const grid = useMemo(() => {
    const pts: number[] = []
    const ext = 240, step = 6
    for (let i = -ext; i <= ext; i += step) { pts.push(i, 0, -ext, i, 0, ext); pts.push(-ext, 0, i, ext, 0, i) }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return geo
  }, [])
  const mats = useMemo(() => ({
    floor: new THREE.MeshBasicMaterial({ color: '#16171a', transparent: true, opacity: 0, fog: true, depthWrite: false }),
    grid: new THREE.LineBasicMaterial({ color: '#F4F4F0', transparent: true, opacity: 0, fog: true, depthWrite: false }),
    line: new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0, fog: false, toneMapped: false, depthWrite: false }),
  }), [])
  useEffect(() => () => { grid.dispose(); Object.values(mats).forEach((m) => m.dispose()) }, [])
  const line = useRef<THREE.Mesh>(null!)
  useFrame(({ scene, camera }) => {
    const h = S.stage.horizon
    g.current.visible = h > 0.002
    mats.floor.opacity = h; mats.grid.opacity = h * 0.1; mats.line.opacity = h * 0.5
    if (scene.fog) { const f = scene.fog as THREE.Fog; f.near = 14; f.far = 120 }
    // the lime hairline rides ~26 units ahead of the camera, so it always reads as the far edge of the floor
    const fx = -Math.sin(Math.atan2(camera.position.x, camera.position.z)), fz = -Math.cos(Math.atan2(camera.position.x, camera.position.z))
    const yaw = Math.atan2(camera.position.x, camera.position.z)
    line.current.position.set(camera.position.x + fx * 26, 0.02, camera.position.z + fz * 26)
    line.current.rotation.y = yaw
  })
  return (
    <group ref={g} position={[0, FLOOR_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.floor} renderOrder={1}><planeGeometry args={[600, 600]} /></mesh>
      <lineSegments geometry={grid} material={mats.grid} renderOrder={2} />
      <mesh ref={line} material={mats.line} renderOrder={3}><planeGeometry args={[260, 0.03]} /></mesh>
    </group>
  )
}
export const BG = CARBON
