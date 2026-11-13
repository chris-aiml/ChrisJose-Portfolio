import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { S, DEG, LIME } from './store'
import { buildBand } from './band'
import { brushedTexture, titaniumMaterial } from './materials'
import { Particles } from './Particles'

/**
 * Opening act: a team network (nodes and links around one lead node).
 * Leadership act: the same nodes flow onto a brushed-titanium infinity ribbon (Infinity 2026), drawn on with a lime edge.
 */
export function Centerpiece() {
  const root = useRef<THREE.Group>(null!)
  const inner = useRef<THREE.Group>(null!)
  const limeMesh = useRef<THREE.Mesh>(null!)
  const head = useRef<THREE.Mesh>(null!)

  const brush = useMemo(() => brushedTexture(), [])
  const mob = useMemo(() => buildBand('mobius', 520, 0.5, 0.07), [])
  const matM = useMemo(() => titaniumMaterial(brush, { windowed: true, rim: 0.95 }), [brush])
  const tube = useMemo(() => new THREE.TubeGeometry(mob.edge!, 900, 0.012, 6, true), [mob])
  const tubeCount = useMemo(() => tube.index!.count, [tube])
  useEffect(() => () => { [mob.geometry, tube, brush, matM.material].forEach((o) => (o as { dispose(): void }).dispose()) }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const { pos, rot, scale } = S.center, st = S.stage
    root.current.position.set(pos.x, pos.y, pos.z)
    root.current.rotation.set(rot.x * DEG, rot.y * DEG, rot.z * DEG)
    root.current.scale.setScalar(Math.max(scale, 0.0001) * 0.8)
    root.current.visible = scale > 0.01
    inner.current.rotation.y = t * 0.06 * (1 - THREE.MathUtils.clamp(st.mobius, 0, 1))

    const mo = THREE.MathUtils.clamp(st.mobius, 0, 1)
    matM.uniforms.uLo.value = 0; matM.uniforms.uHi.value = mo * 1.001
    const limeEff = mo < 1 ? Math.min(st.lime, mo * 0.5) : st.lime
    const n = Math.floor((limeEff * tubeCount) / 3) * 3
    tube.setDrawRange(0, n)
    limeMesh.current.visible = n > 0
    head.current.visible = limeEff > 0.002 && limeEff < 0.999
    if (head.current.visible) head.current.position.copy(mob.edge!.getPointAt(Math.min(limeEff, 0.9999)))
  })

  return (
    <group ref={root}>
      <group ref={inner}>
        <Particles />
        <mesh geometry={mob.geometry} material={matM.material} />
        <mesh ref={limeMesh} geometry={tube}><meshBasicMaterial color={LIME} toneMapped={false} /></mesh>
        <mesh ref={head}><sphereGeometry args={[0.045, 16, 16]} /><meshBasicMaterial color={LIME} toneMapped={false} /></mesh>
      </group>
    </group>
  )
}
