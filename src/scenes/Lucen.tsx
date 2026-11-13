import { useEffect, useRef, useState } from 'react'
import { LUCEN } from '../content'
import { Chapter, useScene } from '../story/Chapter'
import { engine } from '../story/engine'
import { C, clamp, lerp, sm, easeOut } from '../story/palette'

const NX = 1400
const g = (x: number, c: number, w: number) => Math.exp(-((x - c) * (x - c)) / (2 * w * w))
const ecg = (ph: number) => { const x = ph - Math.floor(ph); return 0.12 * g(x, .16, .035) - 0.1 * g(x, .27, .012) + 1 * g(x, .3, .011) - 0.22 * g(x, .33, .014) + 0.26 * g(x, .55, .06) }
const STAGE_AT = [0.5, 0.64, 0.78, 0.9]

interface Sim { hr: number; br: number; mv: number; risk: number; stage: number; label: string }
/** One simulated night, 0..1: calm sleep, onset (heart and breathing race while the body stays still), detection, three haptic stages, resolution. */
function sim(p: number): Sim {
  const onset = sm(0.16, 0.38, p), res = sm(0.9, 0.99, p)
  const hr = 56 + 58 * onset - 44 * res, br = 13 + 14 * onset - 11 * res
  const stage = p < STAGE_AT[0] ? 0 : p < STAGE_AT[1] ? 1 : p < STAGE_AT[2] ? 2 : p < STAGE_AT[3] ? 3 : 0
  const risk = clamp(0.1 + 0.83 * onset + (stage ? 0.03 : 0) - 0.72 * res, 0, 0.99)
  const label = p < 0.16 ? 'Asleep' : p < 0.38 ? 'Pattern building' : p < 0.5 ? 'Held above threshold' : stage ? LUCEN.stages[stage - 1].name : 'Resolved'
  return { hr, br, mv: p > 0.18 && p < 0.9 ? 0 : 0.06, risk, stage, label }
}

/** The whole night is computed once, so the scan can sweep over it like a read head. */
function trace() {
  const hr = new Float32Array(NX), br = new Float32Array(NX), mv = new Float32Array(NX), hap = new Float32Array(NX), risk = new Float32Array(NX)
  let ph = 0, pb = 0, pf = 0
  for (let i = 0; i < NX; i++) {
    const p = i / (NX - 1), s = sim(p)
    ph += (s.hr / 56) / 15; pb += (s.br / 13) / 90; pf += s.stage === 1 ? 0.07 : s.stage === 2 ? 0.14 : s.stage === 3 ? 0.26 : 0
    hr[i] = ecg(ph) * (0.78 + 0.22 * (s.hr - 56) / 58)
    br[i] = Math.sin(pb * 6.283) * (0.62 - 0.22 * sm(0.16, 0.38, p))
    mv[i] = s.mv > 0.01 ? (Math.sin(i * 1.9) * 0.5 + Math.sin(i * 4.3) * 0.5) * 0.26 : 0.012 * Math.sin(i * 7)
    hap[i] = s.stage ? (Math.sin(pf * 6.283) > (s.stage === 1 ? 0.8 : 0.1) ? 0.85 : -0.15) : -0.15
    risk[i] = s.risk
  }
  return [hr, br, mv, hap, risk]
}

export function Lucen() {
  const cv = useRef<HTMLCanvasElement>(null)
  const out = useRef<Record<string, HTMLElement | null>>({})
  const a = useRef<HTMLDivElement>(null)
  const b = useRef<HTMLDivElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const data = useRef<Float32Array[]>([])
  const dim = useRef({ W: 0, H: 0, dpr: 1 })
  const hover = useRef<number | null>(null)
  const scan = useRef(0)
  const [tab, setTab] = useState(0)
  const [stage, setStage] = useState(0)
  const stageR = useRef(-1)
  const ink = useRef<HTMLSpanElement>(null)
  const tabs = useRef<HTMLButtonElement[]>([])

  useEffect(() => {
    data.current = trace()
    const canvas = cv.current!
    const fit = () => { const dpr = Math.min(2, window.devicePixelRatio || 1); const W = canvas.clientWidth, H = canvas.clientHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); dim.current = { W, H, dpr } }
    fit(); const ro = new ResizeObserver(fit); ro.observe(canvas)
    const mv = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); hover.current = clamp((e.clientX - r.left) / r.width) }
    const lv = () => { hover.current = null }
    canvas.addEventListener('pointermove', mv); canvas.addEventListener('pointerleave', lv)
    return () => { ro.disconnect(); canvas.removeEventListener('pointermove', mv); canvas.removeEventListener('pointerleave', lv) }
  }, [])

  useEffect(() => { // sliding ink under the active tab
    const el = tabs.current[tab], ik = ink.current
    if (el && ik) { ik.style.width = el.offsetWidth + 'px'; ik.style.transform = `translateX(${el.offsetLeft}px)` }
  }, [tab])

  useScene('lucen', (p, t, dt) => {
    const flow = document.documentElement.hasAttribute('data-flow')
    const { W, H, dpr } = dim.current; if (!W) return
    const ctx = cv.current!.getContext('2d')!
    const run = flow ? 0.97 : clamp((p - 0.06) / 0.78)               // the scan sweeps over the night
    const target = hover.current ?? run
    scan.current += (target - scan.current) * (1 - Math.exp(-10 * Math.max(dt, 0.016)))
    const sp = scan.current, sx = sp * W
    const d = data.current; if (!d.length) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
    const rows = 5, lm = Math.min(112, W * 0.17)
    const rh = H / rows
    const cols = [C.rose, C.paper, C.mint, C.butter, C.rose]
    const names = ['Heart rate', 'Breathing', 'Motion', 'Haptics', 'Risk score']
    const X = (i: number) => lm + (i / (NX - 1)) * (W - lm)
    const si = clamp(Math.round(((sx - lm) / (W - lm)) * (NX - 1)), 0, NX - 1)
    for (let r = 0; r < rows; r++) {
      const top = r * rh, mid = top + rh / 2, amp = rh * 0.36
      ctx.strokeStyle = 'rgba(243,235,221,.1)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, top + 0.5); ctx.lineTo(W, top + 0.5); ctx.stroke()
      ctx.fillStyle = 'rgba(243,235,221,.55)'; ctx.font = `600 ${W < 520 ? 9 : 10.5}px "JetBrains Mono Variable", monospace`; ctx.textBaseline = 'middle'
      ctx.fillText(names[r].toUpperCase(), 10, mid)
      const ser = d[r]
      const y = (i: number) => r === 4 ? top + rh - 8 - ser[i] * (rh - 18) : mid - ser[i] * amp
      // ghost of the whole night
      ctx.strokeStyle = 'rgba(243,235,221,.17)'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.beginPath()
      for (let i = 0; i < NX; i += 2) { const x = X(i); if (i === 0) ctx.moveTo(x, y(i)); else ctx.lineTo(x, y(i)) }
      ctx.stroke()
      // the part the scan has read, lit
      ctx.strokeStyle = cols[r]; ctx.lineWidth = r === 0 ? 2 : 1.7; ctx.beginPath()
      for (let i = 0; i <= si; i += 2) { const x = X(i); if (i === 0) ctx.moveTo(x, y(i)); else ctx.lineTo(x, y(i)) }
      ctx.stroke()
      if (r === 4) { // threshold 0.90 and the area under the risk line
        const ty = top + rh - 8 - 0.9 * (rh - 18)
        ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(255,213,74,.7)'; ctx.beginPath(); ctx.moveTo(lm, ty); ctx.lineTo(W, ty); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = 'rgba(255,122,154,.16)'; ctx.beginPath(); ctx.moveTo(X(0), top + rh - 8)
        for (let i = 0; i <= si; i += 2) ctx.lineTo(X(i), y(i)); ctx.lineTo(X(si), top + rh - 8); ctx.closePath(); ctx.fill()
        ctx.fillStyle = 'rgba(255,213,74,.9)'; ctx.fillText('0.90', W - 38, ty - 9)
      }
      const hx = X(si); ctx.fillStyle = cols[r]; ctx.beginPath(); ctx.arc(hx, y(si), 4, 0, 6.283); ctx.fill()
    }
    // haptic stage ticks along the night
    STAGE_AT.slice(0, 3).forEach((sa, k) => {
      const x = lm + sa * (W - lm); ctx.strokeStyle = 'rgba(255,213,74,.35)'; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = 'rgba(255,213,74,.9)'; ctx.font = `700 10px "JetBrains Mono Variable", monospace`; ctx.fillText(`0${k + 1}`, x + 5, 12)
    })
    // the scan line: a bright read head with a trailing glow
    const tr = ctx.createLinearGradient(sx - 150, 0, sx, 0); tr.addColorStop(0, 'rgba(255,213,74,0)'); tr.addColorStop(1, 'rgba(255,213,74,.2)')
    ctx.fillStyle = tr; ctx.fillRect(Math.max(lm, sx - 150), 0, Math.min(150, sx - lm), H)
    ctx.strokeStyle = C.butter; ctx.lineWidth = 2; ctx.shadowColor = C.butter; ctx.shadowBlur = 14; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke(); ctx.shadowBlur = 0
    ctx.fillStyle = C.butter; ctx.beginPath(); ctx.moveTo(sx - 7, 0); ctx.lineTo(sx + 7, 0); ctx.lineTo(sx, 10); ctx.closePath(); ctx.fill()

    // readouts at the scan position
    const s = sim(si / (NX - 1)), o = out.current
    if (o.hr) o.hr.textContent = String(Math.round(s.hr))
    if (o.br) o.br.textContent = String(Math.round(s.br))
    if (o.mv) o.mv.textContent = s.mv > 0.01 ? 'Moving' : 'Still'
    if (o.risk) o.risk.textContent = s.risk.toFixed(2)
    if (o.state) o.state.textContent = s.label
    if (o.bar) o.bar.style.transform = `scaleX(${s.risk.toFixed(3)})`
    if (o.root) { o.root.dataset.alarm = s.risk >= 0.9 ? '1' : '0' }
    if (s.stage !== stageR.current) { stageR.current = s.stage; setStage(s.stage) }

    // left column: the story first, then the detail tabs
    const sw = flow ? 1 : sm(0.84, 0.92, p)
    a.current!.style.opacity = String(1 - sw); a.current!.style.pointerEvents = sw < 0.5 ? 'auto' : 'none'
    a.current!.style.transform = `translateY(${-sw * 24}px)`
    b.current!.style.opacity = String(sw); b.current!.style.pointerEvents = sw > 0.5 ? 'auto' : 'none'
    b.current!.style.transform = `translateY(${(1 - sw) * 24}px)`
    // count-up strip
    const cu = flow ? 1 : easeOut(clamp(p / 0.2))
    strip.current?.querySelectorAll<HTMLElement>('[data-to]').forEach((el) => {
      const to = +el.dataset.to!, dec = +el.dataset.dec!
      el.textContent = (to * cu).toFixed(dec) + (el.dataset.suf ?? '')
    })
    void t, void lerp
  })

  const jumpStage = (n: number) => {
    engine.scrollToP('lucen', 0.06 + [0.53, 0.67, 0.81][n - 1] * 0.78)
    try { navigator.vibrate?.(n === 1 ? [90, 80, 90] : n === 2 ? [180, 60, 180, 60, 180] : [320, 50, 320, 50, 320]) } catch { /* not supported */ }
  }
  const ref = (k: string) => (e: HTMLElement | null) => { out.current[k] = e }
  const T = LUCEN.tabs[tab]
  return (
    <Chapter id="lucen">
      <div className="lucen stage-night" ref={ref('root')}>
        <div className="lcol">
          <div className="lsa" ref={a}>
            <span className="label rose">{LUCEN.index}</span>
            <h2 className="display">{LUCEN.title}</h2>
            <p className="lsub mono">{LUCEN.sub}</p>
            <p className="lbody">{LUCEN.body}</p>
            <div className="lstrip" ref={strip}>
              {LUCEN.strip.map((s) => (
                <div key={s.k}><b className="display" data-to={s.to} data-dec={s.dec} data-suf={s.suffix}>0{s.suffix}</b><span className="mono">{s.k}</span><em>{s.d}</em></div>
              ))}
            </div>
            <p className="ldis mono dim">{LUCEN.disclaimer}</p>
          </div>
          <div className="lsb" ref={b}>
            <div className="ltabs" role="tablist">
              <span className="ink" ref={ink} aria-hidden />
              {LUCEN.tabs.map((x, i) => <button key={x.id} ref={(e) => { if (e) tabs.current[i] = e }} role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => setTab(i)}>{x.label}</button>)}
            </div>
            <div className="ltab" key={T.id}>
              <p className="llead">{T.lead}</p>
              <dl>{T.rows.map(([k, v]) => <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>)}</dl>
              {T.note && <p className="mono dim lnote">{T.note}</p>}
            </div>
            <a className="btn" href={LUCEN.href} target="_blank" rel="noopener"><span>Open the prototype</span><span aria-hidden>↗</span></a>
          </div>
        </div>
        <div className="lgraph">
          <div className="lhd mono"><span>Simulated night</span><span ref={ref('state')}>Asleep</span></div>
          <canvas ref={cv} aria-label="Simulated night: heart rate, breathing, motion, haptics and risk score" role="img" />
          <div className="lrd mono">
            <span>Heart rate <b><em ref={ref('hr')}>56</em> bpm</b></span>
            <span>Breathing <b><em ref={ref('br')}>13</em> /min</b></span>
            <span>Motion <b><em ref={ref('mv')}>Still</em></b></span>
            <span>Risk <b ref={ref('risk')}>0.10</b></span>
            <span className="rb"><i ref={ref('bar')} /></span>
          </div>
          <div className="lstages">
            {LUCEN.stages.map((s) => <button key={s.n} className={stage === s.n ? 'on' : ''} onClick={() => jumpStage(s.n)}><b>0{s.n}</b><span>{s.name}</span><em>{s.when}</em></button>)}
          </div>
          <p className="mono dim lhint">Hover the graph to scrub. Tap a stage to jump to it; phones buzz.</p>
        </div>
      </div>
    </Chapter>
  )
}
