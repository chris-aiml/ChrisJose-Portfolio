import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildStudioEnv } from './environment'
import { Rig } from './Rig'
import { Centerpiece } from './Centerpiece'
import { Device } from './Device'
import { Stars } from './Stars'
import { Horizon } from './Horizon'
import { CARBON } from './store'

export function Scene() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const env = buildStudioEnv(gl)
    scene.environment = env
    scene.background = new THREE.Color(CARBON)
    scene.fog = new THREE.Fog(CARBON, 14, 120)
    return () => { env.dispose(); scene.environment = null }
  }, [gl, scene])
  return (
    <>
      <Rig />
      <hemisphereLight args={['#dfe6ff', '#0a0a0b', 0.35]} />
      <directionalLight position={[-4, 6, 5]} intensity={1.1} color="#ffffff" />
      <Stars />
      <Horizon />
      <Centerpiece />
      <Device />
    </>
  )
}
