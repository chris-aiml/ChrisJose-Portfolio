import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { buildStudioEnv } from '../device/environment'
import { Device } from '../device/Device'
import { DV, SM, INK } from '../device/store'

function Env() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const env = buildStudioEnv(gl)
    scene.environment = env
    return () => { env.dispose(); scene.environment = null }
  }, [gl, scene])
  return null
}

/** Draws frames only while the chapter is near, and re-syncs the eased state when it starts again so nothing rushes in. */
function Gate({ run }: { run: boolean }) {
  const setFrameloop = useThree((s) => s.setFrameloop)
  useEffect(() => {
    if (run) SM.snap = true
    setFrameloop(run ? 'always' : 'never')
  }, [run, setFrameloop])
  return null
}

/** The track the train rolls on: appears under the wheels as the device becomes a train. */
function Track() {
  const m = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  useFrame(({ viewport }) => {
    const s = Math.min(0.8, (viewport.width * 0.84) / 5.6)
    const tr = THREE.MathUtils.clamp(SM.tr, 0, 1)
    m.current.visible = tr > 0.2 || DV.warming
    mat.current.opacity = THREE.MathUtils.clamp((tr - 0.2) / 0.5, 0, 1)
    m.current.position.set(0, SM.y - 1.09 * s, 0)
    m.current.scale.set(1, 0.5, s * 1.2)
  })
  return <mesh ref={m}><boxGeometry args={[60, 0.035, 1]} /><meshBasicMaterial ref={mat} color={INK} transparent /></mesh>
}

/**
 * The canvas is created once, ahead of the chapter, and kept for the whole visit, so the model is always there when you arrive.
 * `run` is false while the chapter is far away (no frames drawn) and during the first few frames it warms up regardless.
 */
export default function HardwareCanvas({ run, onWarm }: { run: boolean; onWarm: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.5]} camera={{ fov: 30, near: 0.1, far: 100, position: [0, 0.5, 8.2] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Env />
      <Gate run={run} />
      <hemisphereLight args={['#fff4dc', '#3a2a10', 0.5]} />
      <directionalLight position={[-4, 6, 5]} intensity={1.1} color="#ffffff" />
      <Device onWarm={onWarm} />
      <Track />
    </Canvas>
  )
}
