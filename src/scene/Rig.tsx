import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { S, DEG } from './store'
import { cameraObj, centerObj, stageObj, deviceObj } from '../theatre/sheet'

const tmpR = new THREE.Vector3()
const tmpU = new THREE.Vector3()
const look = new THREE.Vector3()
const pos = new THREE.Vector3()

/** Reads Theatre values (already positioned by the scroll system) and drives the camera. */
export function Rig() {
  const { camera, size } = useThree()
  useFrame((_, dt) => {
    const c = cameraObj.value, ce = centerObj.value, st = stageObj.value, dv = deviceObj.value
    Object.assign(S.cam, { az: c.az, R: c.R, h: c.h, off: c.off, fov: c.fov }); S.cam.c = c.c
    S.center.pos = ce.pos; S.center.rot = ce.rot; S.center.scale = ce.scale
    Object.assign(S.stage, st); S.device.pos = dv.pos; S.device.rot = dv.rot

    const k = 1 - Math.exp(-6 * dt)
    S.pointer.sx += (S.pointer.x - S.pointer.sx) * k
    S.pointer.sy += (S.pointer.y - S.pointer.sy) * k
    S.manual.value += (S.manual.target - S.manual.value) * (1 - Math.exp(-5 * dt))

    const aspect = size.width / size.height
    const narrow = aspect < 0.9
    const az = (c.az + S.pointer.sx * 3.2) * DEG
    const R = c.R * (narrow ? 1.55 : aspect < 1.25 ? 1.2 : 1)
    const h = c.h + S.pointer.sy * 0.35 + (narrow ? 0.3 : 0)
    const off = c.off * (narrow ? 0 : aspect < 1.25 ? 0.55 : 1)

    look.set(c.c.x, c.c.y + (narrow ? -0.15 : 0), c.c.z)
    pos.set(look.x + Math.sin(az) * R, look.y + h, look.z + Math.cos(az) * R)
    camera.position.copy(pos)
    camera.lookAt(look)
    // push the subject sideways on screen: slide camera along its own right axis
    tmpR.setFromMatrixColumn(camera.matrixWorld, 0)
    camera.position.addScaledVector(tmpR, -off)
    if (narrow) { tmpU.setFromMatrixColumn(camera.matrixWorld, 1); camera.position.addScaledVector(tmpU, -0.55) }
    const cam = camera as THREE.PerspectiveCamera
    const fov = c.fov * (narrow ? 1.25 : 1)
    if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix() }
  })
  return null
}
