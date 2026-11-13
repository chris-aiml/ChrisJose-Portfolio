import { useEffect, useRef, useState } from 'react'
import { LUCEN } from '../content'

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const sm = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t) }
const g = (x: number, c: number, w: number) => Math.exp(-((x - c) * (x - c)) / (2 * w * w))
const ecg = (ph: number) => { const x = ph - Math.floor(ph); return 0.12 * g(x, .16, .035) - 0.1 * g(x, .27, .012) + 1 * g(x, .3, .011) - 0.22 * g(x, .33, .014) + 0.26 * g(x, .55, .06) }

type Sim = { hr: number; br: number; mv: number; risk: number; stage: number; label: string }
/** One simulated night, 0..1: calm sleep, onset (heart and breathing race while the body stays still), detection, three haptic stages, resolution. */
function sim(p: number): Sim {
  const onset = sm(0.16, 0.38, p), res = sm(0.9, 0.99, p)
  const hr = 56 + 58 * onset - 44 * res
  const br = 13 + 14 * onset - 11 * res
  const stage = p < 0.5 ? 0 : p < 0.64 ? 1 : p < 0.78 ? 2 : p < 0.9 ? 3 : 0
  const risk = clamp(0.1 + 0.83 * onset + (stage ? 0.03 : 0) - 0.72 * res, 0, 0.99)
  const label = p < 0.16 ? 'Asleep' : p < 0.38 ? 'Pattern building' : p < 0.5 ? 'Held above threshold' : stage ? LUCEN.stages[stage - 1].name : 'Resolved'
  return { hr, br, mv: p > 0.18 && p < 0.9 ? 0.0 : 0.06, risk, stage, label }
}

/** Scroll-driven teaser of the Lucen detector: heart rate, breathing, motion and haptic traces over one simulated night. */
export function PulseTease() {
  const root = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const out = useRef<Record<string, HTMLElement | null>>({})
  const [stage, setStage] = useState(0)
  const [auto, setAuto] = useState(false)
  const [mode, setMode] = useState<'scroll' | 'play' | 'manual'>('scroll')
  const modeRef = useRef<'scroll' | 'play' | 'manual'>('scroll')
  const manualP = useRef(0)
  const playP = useRef(0)
  const slider = useRef<HTMLInputElement>(null)
  const dragging = useRef(false)
  const setM = (m: 'scroll' | 'play' | 'manual') => { modeRef.current = m; setMode(m) }

  useEffect(() => {
    const el = root.current!, canvas = cv.current!, ctx = canvas.getContext('2d')!
    const staticMode = document.documentElement.hasAttribute('data-static') || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setAuto(staticMode)
    const chapter = document.getElementById('chapter-lucen')
    let W = 0, H = 0, dpr = 1
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = canvas.clientWidth; H = canvas.clientHeight
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
    }
    resize(); const ro = new ResizeObserver(resize); ro.observe(canvas)
    const ROWS = 4, SPEED = 86
    let hist: Float32Array[] = []
    const reset = () => { hist = Array.from({ length: ROWS }, () => new Float32Array(Math.ceil(W) + 4)) }
    reset()
    let ph = { hr: 0, br: 0, hap: 0 }, ps = 0, target = 0, last = performance.now(), raf = 0, acc = 0, inView = true, shown = -1
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting }); io.observe(el)
    const readP = (now: number, dt: number) => {
      if (modeRef.current === 'manual') return manualP.current
      if (modeRef.current === 'play') { playP.current = (playP.current + dt / 24) % 1; return playP.current }
      if (staticMode) return (now / 1000 / 26) % 1
      const vh = window.innerHeight
      if (document.documentElement.dataset.layout === 'pin' && chapter) {
        const r = chapter.getBoundingClientRect()
        return clamp(-r.top / Math.max(1, r.height - vh))
      }
      const r = el.getBoundingClientRect()
      return clamp((vh * 0.85 - r.top) / (vh * 0.85 + r.height * 0.5))
    }
    const rowGeom = (i: number) => { const rh = H / ROWS; return { top: i * rh, mid: i * rh + rh / 2, amp: rh * 0.36 } }
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const cols = ['#D2FF00', '#F4F4F0', '#F4F4F0', '#D2FF00']
      for (let i = 0; i < ROWS; i++) {
        const { top, mid, amp } = rowGeom(i)
        ctx.strokeStyle = 'rgba(244,244,240,.09)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(0, top + 0.5); ctx.lineTo(W, top + 0.5); ctx.stroke()
        ctx.strokeStyle = 'rgba(244,244,240,.05)'; ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke(); ctx.setLineDash([])
        const h = hist[i]; const n = Math.min(h.length, Math.ceil(W))
        ctx.strokeStyle = cols[i]; ctx.lineWidth = i === 0 ? 1.6 : 1.3; ctx.lineJoin = 'round'
        ctx.beginPath()
        for (let x = 0; x < n; x++) {
          const v = h[h.length - 1 - (n - 1 - x)]
          const y = mid - v * amp
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        // fade the left edge so traces enter from nothing
        ctx.stroke()
        const gr = ctx.createLinearGradient(0, 0, W * 0.34, 0); gr.addColorStop(0, 'rgba(12,13,15,.92)'); gr.addColorStop(0.55, 'rgba(12,13,15,.6)'); gr.addColorStop(1, 'rgba(12,13,15,0)')
        ctx.fillStyle = gr; ctx.fillRect(0, top + 1, W * 0.34, H / ROWS - 1)
        // live head
        const hv = h[h.length - 1]; ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(n - 1, mid - hv * amp, 2.6, 0, 6.283); ctx.fill()
      }
    }
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!inView) { last = now; return }
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      target = readP(now, dt)
      if (slider.current && !dragging.current) slider.current.value = String(Math.round(ps * 1000))
      ps += (target - ps) * (1 - Math.exp(-5 * dt))
      const s = sim(ps)
      ph.hr += dt * s.hr / 60; ph.br += dt * s.br / 60
      ph.hap += dt * (s.stage === 1 ? 1.2 : s.stage === 2 ? 2.4 : s.stage === 3 ? 4.2 : 0)
      acc += dt * SPEED
      let cols = Math.floor(acc); acc -= cols
      while (cols-- > 0) {
        const t = 1 / SPEED
        const nv = [
          ecg(ph.hr - cols * t * s.hr / 60) * (0.78 + 0.22 * (s.hr - 56) / 58),
          Math.sin((ph.br - cols * t * s.br / 60) * 6.283) * (0.62 - 0.22 * sm(0.16, 0.38, ps)),
          (s.mv > 0.01 ? (Math.sin(now * 0.009 + cols) * 0.5 + Math.sin(now * 0.021 + cols * 3) * 0.5) * 0.28 : 0.012 * Math.sin(now * 0.05 + cols)),
          s.stage ? (Math.sin((ph.hap - cols * t * (s.stage === 1 ? 1.2 : s.stage === 2 ? 2.4 : 4.2)) * 6.283) > (s.stage === 1 ? 0.8 : 0.1) ? 0.85 : -0.15) : -0.15,
        ]
        for (let i = 0; i < ROWS; i++) { const h = hist[i]; h.copyWithin(0, 1); h[h.length - 1] = nv[i] }
      }
      draw()
      const o = out.current
      if (o.hr) o.hr.textContent = String(Math.round(s.hr))
      if (o.br) o.br.textContent = String(Math.round(s.br))
      if (o.mv) o.mv.textContent = s.mv > 0.01 ? 'Moving' : 'Still'
      if (o.risk) o.risk.textContent = s.risk.toFixed(2)
      if (o.state) o.state.textContent = s.label
      if (o.bar) (o.bar as HTMLElement).style.transform = `scaleX(${ps.toFixed(3)})`
      if (o.riskbar) (o.riskbar as HTMLElement).style.transform = `scaleX(${s.risk.toFixed(3)})`
      el.dataset.alarm = s.risk >= 0.9 ? '1' : '0'; el.dataset.stage = String(s.stage)
      if (shown !== s.stage) { shown = s.stage; setStage(s.stage) }
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect() }
  }, [])

  const jump = (n: number) => {
    manualP.current = [0.57, 0.71, 0.84][n - 1]; setM('manual')
    try { navigator.vibrate?.(n === 1 ? [90, 80, 90] : n === 2 ? [180, 60, 180, 60, 180] : [320, 50, 320, 50, 320]) } catch { /* not supported */ }
  }
  const ref = (k: string) => (e: HTMLElement | null) => { out.current[k] = e }
  return (
    <div className="pcard" ref={root} data-auto={auto ? '1' : '0'}>
      <div className="phead mono"><span>Lucen · Simulated night</span><span className="pbar"><i ref={ref('bar')} /></span></div>
      <div className="pctl">
        <div className="seg" role="group" aria-label="Simulation control">
          <button aria-pressed={mode === 'scroll'} onClick={() => setM('scroll')} data-cursor="">Scroll</button>
          <button aria-pressed={mode === 'play'} onClick={() => { playP.current = manualP.current = 0; setM(mode === 'play' ? 'scroll' : 'play') }} data-cursor="">{mode === 'play' ? 'Pause' : 'Play'}</button>
        </div>
        <input ref={slider} type="range" min={0} max={1000} defaultValue={0} aria-label="Scrub the simulated night"
          onPointerDown={() => { dragging.current = true }} onPointerUp={() => { dragging.current = false }}
          onChange={(e) => { manualP.current = +e.currentTarget.value / 1000; if (modeRef.current !== 'manual') setM('manual') }} data-cursor="SCRUB" />
      </div>
      <div className="ptr">
        <div className="plab mono"><span>Heart rate</span><b><em ref={ref('hr')}>56</em> bpm</b></div>
        <div className="plab mono"><span>Breathing</span><b><em ref={ref('br')}>13</em> /min</b></div>
        <div className="plab mono"><span>Motion</span><b><em ref={ref('mv')}>Still</em></b></div>
        <div className="plab mono"><span>Haptics</span><b><em>{stage ? LUCEN.stages[stage - 1].name : 'Idle'}</em></b></div>
        <canvas ref={cv} aria-hidden />
      </div>
      <div className="prisk">
        <div className="mono"><span>Risk score</span><b ref={ref('risk')}>0.10</b></div>
        <span className="rbar"><i ref={ref('riskbar')} /><u /></span>
        <div className="mono dim"><span ref={ref('state')}>Asleep</span><span>Threshold 0.90</span></div>
      </div>
      <div className="stagebar">
        {LUCEN.stages.map((s) => (<button key={s.n} className={stage === s.n ? 'on' : ''} onClick={() => jump(s.n)} data-cursor="FEEL IT"><b>0{s.n}</b>{s.name}<br />{s.when}</button>))}
      </div>
      <p className="phint mono dim">Tap a stage to jump to it. On a phone it buzzes.</p>
      <a className="btn" href={LUCEN.href} target="_blank" rel="noopener" data-cursor="OPEN"><span>Open the prototype</span><span aria-hidden>↗</span></a>
    </div>
  )
}
