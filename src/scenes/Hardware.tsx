import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { HARDWARE } from '../content'
import { Chapter, useScene, useNarrow } from '../story/Chapter'
import { C, clamp, lerp, sm, easeInOut } from '../story/palette'
import { DV } from '../device/store'

const HardwareCanvas = lazy(() => import('./HardwareCanvas'))

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  componentDidCatch(e: unknown) { console.warn('3D device disabled:', e) }
  render() { return this.state.err ? this.props.fallback : this.props.children }
}

/** Flat drawing of the device, used when WebGL is not available or in ?static mode. */
export function StaticDevice() {
  return (
    <svg className="sdev" viewBox="0 0 300 420" role="img" aria-label="Illustration of the air-quality monitoring device">
      <ellipse cx="150" cy="392" rx="96" ry="12" fill="#1B1224" opacity=".22" />
      <rect x="70" y="40" width="160" height="334" rx="26" fill="#4d4e52" /><rect x="70" y="40" width="160" height="334" rx="26" fill="none" stroke="#FF7A9A" strokeWidth="2" opacity=".8" />
      <ellipse cx="150" cy="46" rx="80" ry="20" fill="#2f3033" /><ellipse cx="150" cy="46" rx="62" ry="13" fill="#1b1c1e" /><circle cx="150" cy="46" r="10" fill="#4d4e52" />
      {[110, 160, 330].map((y) => <rect key={y} x="70" y={y} width="160" height="26" fill="#9b9ca0" opacity=".85" />)}
      <rect x="170" y="196" width="46" height="96" rx="16" fill="#050506" /><circle cx="182" cy="278" r="4" fill="#ff3b30" />
      <rect x="226" y="80" width="28" height="256" rx="14" fill="none" stroke="#4d4e52" strokeWidth="9" />
    </svg>
  )
}

export function Hardware() {
  const root = useRef<HTMLDivElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const dep = useRef<HTMLDivElement>(null)
  const narrow = useNarrow()
  const [mount, setMount] = useState(false)   // the canvas is created once, ahead of time, and kept
  const [near, setNear] = useState(false)       // the render loop only runs while the chapter is close
  const [warm, setWarm] = useState(false)       // first frames are drawn invisibly so shaders are ready
  const [xp, setXp] = useState(false)
  const xpR = useRef(false); xpR.current = xp
  const wide = useRef(1.6)
  const flowMode = typeof document !== 'undefined' && document.documentElement.hasAttribute('data-flow')

  useEffect(() => {
    const el = root.current!
    const early = new IntersectionObserver(([e]) => { if (e.isIntersecting) setMount(true) }, { rootMargin: '280% 0px' }); early.observe(el)
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '110% 0px' }); io.observe(el)
    const ro = new ResizeObserver(() => { wide.current = el.clientWidth / Math.max(1, el.clientHeight) }); ro.observe(el)
    // fetch the 3D code while the browser is idle so it is never waited for
    const w = window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
    const pre = () => { void import('./HardwareCanvas') }
    const idle = w.requestIdleCallback ? w.requestIdleCallback(pre, { timeout: 6000 }) : window.setTimeout(pre, 4000)
    return () => { early.disconnect(); io.disconnect(); ro.disconnect(); if (w.requestIdleCallback) (window as unknown as { cancelIdleCallback: (n: number) => void }).cancelIdleCallback(idle); else window.clearTimeout(idle) }
  }, [])

  useScene('hardware', (p) => {
    const flow = document.documentElement.hasAttribute('data-flow')
    const nw = narrow.current
    const ex = flow ? 0 : easeInOut(clamp((p - 0.82) / 0.18))
    const tr = flow ? 0 : easeInOut(clamp((p - 0.6) / 0.2))
    const spread = flow ? 0.9 : sm(0.12, 0.4, p) * (1 - sm(0.52, 0.6, p))
    if (p > 0.5 && xpR.current) setXp(false)
    DV.shown = flow ? 1 : sm(0, 0.1, p)
    DV.e = spread
    DV.xp = !flow && p < 0.5 && xpR.current ? 1 : 0
    DV.tr = tr
    DV.scale = flow ? 0.6 : lerp(0.28, 0.58, sm(0, 0.12, p)) * (nw ? 0.72 : 1)
    DV.spin = -32 + (flow ? 0 : p * 150)
    const vis = 4.395 * wide.current                       // visible world width at the device's depth
    const baseX = nw ? 0 : vis * 0.19
    DV.y = nw ? -1.05 : -0.1
    DV.roll = ex * (vis / 2 + 5)
    DV.x = lerp(baseX, 0, tr) + DV.roll
    const cf = flow ? 0 : sm(0.5, 0.6, p)
    copy.current!.style.opacity = String(1 - cf)
    copy.current!.style.transform = `translateY(${flow ? 0 : -sm(0.5, 0.62, p) * 30}px)`
    copy.current!.style.pointerEvents = cf > 0.5 ? 'none' : 'auto'
    const d = flow ? 0 : sm(0.64, 0.76, p) * (1 - sm(0.9, 0.98, p))
    dep.current!.style.opacity = String(d); dep.current!.style.transform = `translateY(${(1 - d) * 20}px)`
    void C
  })

  return (
    <Chapter id="hardware">
      <div className="hw stage-butter" ref={root}>
        <div className="hwbg fill" aria-hidden />
        <div className="gl fill" aria-hidden>
          {mount && !flowMode && (
            <Boundary fallback={<StaticDevice />}>
              <Suspense fallback={null}><HardwareCanvas run={near || !warm} onWarm={() => setWarm(true)} /></Suspense>
            </Boundary>
          )}
          {flowMode && <StaticDevice />}
        </div>
        <div className="hwcopy" ref={copy}>
          <span className="label">{HARDWARE.index}</span>
          <h2 className="display">{HARDWARE.title}</h2>
          <dl className="hwmeta">{HARDWARE.meta.map(([k, v]) => <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>)}</dl>
          <div className="hwbtns">
            <a className="btn ink" href={HARDWARE.cert.href} target="_blank" rel="noopener"><span>{HARDWARE.cert.label}</span><span aria-hidden>↗</span></a>
            {!flowMode && <button className="btn" onClick={() => setXp((v) => !v)} aria-pressed={xp}><span>{xp ? 'Assemble' : 'Exploded view'}</span></button>}
          </div>
        </div>
        <div className="hwdep mono" ref={dep} aria-hidden>CJ EXPRESS · DEPARTING · NEXT STOP: CAPABILITIES</div>
      </div>
    </Chapter>
  )
}
