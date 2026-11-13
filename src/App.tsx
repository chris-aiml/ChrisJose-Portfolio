import { Component, useEffect, useRef, type ReactNode } from 'react'
import { Canvas, addEffect } from '@react-three/fiber'
import * as THREE from 'three'
import { Scene } from './scene/Scene'
import { S } from './scene/store'
import { scroll, scrollState } from './scroll/scrollSystem'
import { maybeInitStudio } from './theatre/sheet'
import { Cursor } from './ui/Cursor'
import { Chrome } from './ui/Chrome'
import { Resume } from './ui/Resume'
import { useLayoutMode, useReveal } from './ui/hooks'
import { About, Capabilities, Contact, Hardware, Intro, Leadership, Lucen, Plix, ResumeSection } from './ui/Sections'

class Boundary extends Component<{ children: ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  componentDidCatch(e: unknown) { console.warn('3D layer disabled:', e); document.documentElement.dataset.nogl = '1' }
  render() { return this.state.err ? null : this.props.children }
}

function Content({ plain = false }: { plain?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)
  return (
    <main className="content" ref={ref}>
      <Intro /><About /><Leadership /><Plix /><Lucen /><Hardware staticMode={plain} />
      <Capabilities /><ResumeSection /><Contact />
    </main>
  )
}

export function App() {
  useLayoutMode()
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.documentElement.classList.toggle('reduced', reduced)
    scroll.init(reduced)
    maybeInitStudio()
    const off = addEffect((t: number) => { scroll.update(t); return false as never })
    const mv = (e: PointerEvent) => { S.pointer.x = (e.clientX / window.innerWidth) * 2 - 1; S.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1) }
    window.addEventListener('pointermove', mv, { passive: true })
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __cj: unknown }).__cj = { scroll, scrollState, S }
    return () => { off(); window.removeEventListener('pointermove', mv); scroll.destroy() }
  }, [])
  return (
    <>
      <div id="stage" aria-hidden>
        <Boundary>
          <Canvas
            dpr={[1, 1.75]} camera={{ fov: 30, near: 0.1, far: 700, position: [0, 1, 8] }}
            gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
          >
            <Scene />
          </Canvas>
        </Boundary>
      </div>
      <Chrome />
      <Content />
      <Cursor />
      <Resume />
    </>
  )
}

/** `?static` (or no WebGL): no canvas, no smooth scroll, same content in normal document flow. */
export function StaticApp() {
  useEffect(() => { document.documentElement.dataset.layout = 'flow' }, [])
  return (
    <>
      <Chrome interactive={false} />
      <Content plain />
      <Cursor />
      <Resume />
    </>
  )
}
