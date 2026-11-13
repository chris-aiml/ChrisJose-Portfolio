import { useEffect, useRef, useMemo } from 'react'
import { ABOUT } from '../content'
import { Chapter, useScene } from '../story/Chapter'
import { C, clamp, lerp, sm, rnd } from '../story/palette'
import { engine } from '../story/engine'

const PH0 = 0.06, PHW = 0.22
const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16)
  const r = lerp(pa >> 16, pb >> 16, t), g = lerp((pa >> 8) & 255, (pb >> 8) & 255, t), bl = lerp(pa & 255, pb & 255, t)
  return `rgb(${r | 0},${g | 0},${bl | 0})`
}
interface Bld { x: number; w: number; h: number; wins: number[] }
function skyline(seed: number, period: number, minH: number, maxH: number, minW: number, maxW: number): Bld[] {
  const r = rnd(seed), out: Bld[] = []
  let x = 0
  while (x < period) {
    const w = minW + r() * (maxW - minW)
    out.push({ x, w, h: minH + r() * (maxH - minH), wins: Array.from({ length: 40 }, () => r()) })
    x += w + r() * 6
  }
  return out
}

export function About() {
  const root = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const tk = useRef<HTMLDivElement>(null)
  const paras = useRef<HTMLParagraphElement[]>([])
  const lastN = useRef<number[]>([])
  const pager = useRef<HTMLSpanElement>(null)
  const sway = useRef<HTMLDivElement>(null)
  const size = useRef({ W: 0, H: 0, dpr: 1 })
  const dist = useRef(0)
  const L = useMemo(() => ({
    far: skyline(11, 2600, 60, 190, 26, 70),
    mid: skyline(23, 2600, 90, 270, 34, 90),
    near: skyline(37, 2600, 120, 340, 46, 120),
    stars: Array.from({ length: 70 }, (_, i) => { const r = rnd(900 + i); return [r(), r() * 0.6, 0.5 + r() * 1.3] as [number, number, number] }),
  }), [])
  const words = useMemo(() => ABOUT.paragraphs.map((p) => p.split(' ')), [])
  const tickerText = useMemo(() => ['NOW AT: ABOUT', ...ABOUT.bar.split(' · '), 'NEXT STOP: LEADERSHIP'].map((s) => s.toUpperCase()), [])

  useEffect(() => {
    const canvas = cv.current!
    const fit = () => { const dpr = Math.min(2, window.devicePixelRatio || 1); const W = canvas.clientWidth, H = canvas.clientHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); size.current = { W, H, dpr } }
    fit(); const ro = new ResizeObserver(fit); ro.observe(canvas)
    paras.current = Array.from(root.current!.querySelectorAll<HTMLParagraphElement>('.ap'))
    lastN.current = paras.current.map(() => -1)
    return () => ro.disconnect()
  }, [])

  useScene('about', (p, t, dt) => {
    const { W, H, dpr } = size.current; if (!W) return
    const flow = document.documentElement.hasAttribute('data-flow')
    const e = engineVel()
    dist.current += (flow ? 0 : 1) * dt * (30 + Math.abs(e) * 28)
    const D = p * 5200 + dist.current
    const n = sm(0.04, 0.92, p)
    const g = cv.current!.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    // sky
    const sk = g.createLinearGradient(0, 0, 0, H)
    sk.addColorStop(0, mix('#5B3366', '#120B1C', n)); sk.addColorStop(0.62, mix('#FF8A8F', '#2B1A3D', n)); sk.addColorStop(1, mix('#FFD54A', '#3A2150', n))
    g.fillStyle = sk; g.fillRect(0, 0, W, H)
    // stars
    g.fillStyle = C.paper
    for (const [sx, sy, sr] of L.stars) { g.globalAlpha = clamp((n - 0.45) * 2.2) * (0.5 + 0.5 * Math.sin(t * 0.002 + sx * 40)); g.beginPath(); g.arc(sx * W, sy * H, sr, 0, 6.283); g.fill() }
    g.globalAlpha = 1
    // sun sinks, moon rises
    const sunY = lerp(H * 0.52, H * 1.05, sm(0, 0.5, n)), moonY = lerp(H * 1.05, H * 0.2, sm(0.45, 1, n))
    g.fillStyle = C.butter; g.beginPath(); g.arc(W * 0.28, sunY, H * 0.13, 0, 6.283); g.fill()
    g.fillStyle = C.paper; g.beginPath(); g.arc(W * 0.72, moonY, H * 0.075, 0, 6.283); g.fill()
    g.fillStyle = mix('#5B3366', '#120B1C', n); g.beginPath(); g.arc(W * 0.72 + H * 0.03, moonY - H * 0.015, H * 0.07, 0, 6.283); g.fill()
    // skyline layers
    const horizon = H * 0.96
    const layer = (arr: Bld[], speed: number, col: string, lit: number) => {
      const period = 2600, off = -((D * speed) % period)
      for (let rep = 0; rep < 2 + Math.ceil(W / period); rep++) {
        for (const b of arr) {
          const x = b.x + off + rep * period
          if (x > W || x + b.w < 0) continue
          const h = b.h * (H / 520)
          g.fillStyle = col; g.fillRect(x, horizon - h, b.w, H - (horizon - h))
          if (lit > 0) {
            for (let i = 0; i < b.wins.length; i++) {
              const cx = x + 5 + (i % 5) * 9, cy = horizon - h + 8 + Math.floor(i / 5) * 13
              if (cx > x + b.w - 6 || cy > horizon - 6) continue
              if (b.wins[i] < lit) { g.fillStyle = b.wins[i] < lit * 0.35 ? C.rose : C.butter; g.globalAlpha = 0.85; g.fillRect(cx, cy, 4, 6); g.globalAlpha = 1 }
            }
          }
        }
      }
    }
    layer(L.far, 0.16, mix('#8A4C77', '#3A2252', n), 0.08 * n)
    layer(L.mid, 0.34, mix('#5B2F63', '#2A1A3A', n), 0.28 * n)
    layer(L.near, 0.7, mix('#3A1F49', '#150C20', n), 0.5 * n)
    // lamp posts + passing pillars: foreground, very fast
    const lp = 520, lo = -((D * 3.2) % lp)
    for (let x = lo; x < W + lp; x += lp) {
      g.fillStyle = '#0E0815'; g.fillRect(x, H * 0.38, 5, H * 0.7)
      g.fillStyle = C.butter; g.globalAlpha = 0.25 + 0.75 * n; g.beginPath(); g.arc(x + 2.5, H * 0.38, 7, 0, 6.283); g.fill()
      g.globalAlpha = 0.18 * n; g.beginPath(); g.arc(x + 2.5, H * 0.38, 26, 0, 6.283); g.fill(); g.globalAlpha = 1
    }
    for (let k = 1; k <= 3; k++) {
      const b = PH0 + PHW * k, u = (p - (b - 0.022)) / 0.044
      if (u > 0 && u < 1) { const x = lerp(W + 40, -W * 0.3, u); g.fillStyle = '#0E0815'; g.fillRect(x, 0, W * 0.2, H) }
    }
    // paragraphs: one at a time, words light up as you scroll
    paras.current.forEach((el, i) => {
      const a = PH0 + PHW * i, lp2 = clamp((p - a) / PHW)
      const inn = sm(0, 0.1, lp2), out = i === paras.current.length - 1 ? 0 : sm(0.9, 1, lp2)
      const vis = flow ? 1 : inn * (1 - out)
      el.style.opacity = String(vis)
      el.style.transform = `translateY(${(1 - inn) * 26 - out * 20}px)`
      el.style.pointerEvents = vis > 0.5 ? 'auto' : 'none'
      const ws = el.children, N = ws.length
      const cnt = flow ? N : Math.floor(clamp((lp2 - 0.06) / 0.66) * N + 0.0001)
      if (cnt !== lastN.current[i]) {
        lastN.current[i] = cnt
        for (let k = 0; k < N; k++) { const c = ws[k].classList; c.toggle('on', k < cnt); c.toggle('cur', k === cnt - 1 && cnt < N) }
      }
    })
    const cur = clamp(Math.floor((p - PH0) / PHW), 0, 3)
    if (pager.current) pager.current.textContent = `0${flow ? 4 : cur + 1} / 04`
    // LED ticker slides with the scroll
    const T = tk.current!; const tw = T.scrollWidth
    T.style.transform = `translateX(${lerp(W * 0.1, -(tw - W * 0.5), clamp(p * 1.05))}px)`
    // straps sway with the carriage
    if (sway.current) sway.current.style.setProperty('--sway', (Math.sin(t * 0.0013) * 2.2 + Math.sin(t * 0.0031) * 0.8 + e * 0.5).toFixed(2) + 'deg')
  })

  return (
    <Chapter id="about">
      <div className="about stage-plum" ref={root}>
        <div className="ticker" aria-hidden><div className="tk" ref={tk}>{[...tickerText, ...tickerText].map((s, i) => <span key={i}>{s}<i>▸</i></span>)}</div></div>
        <div className="aboutwall">
          <div className="win" aria-hidden>
            <canvas ref={cv} />
            <div className="glare" />
            <div className="mull" />
          </div>
          <div className="acopy">
            <span className="label">{ABOUT.index}</span>
            <h2 className="display">{ABOUT.headline} <span className="aside">{ABOUT.aside}</span></h2>
            <div className="paras">
              {words.map((ws, i) => <p key={i} className="ap">{ws.map((w, k) => <span key={k}>{w} </span>)}</p>)}
            </div>
            <span className="pager mono" ref={pager}>01 / 04</span>
          </div>
        </div>
        <div className="seat" aria-hidden>
          <div className="straps" ref={sway}>{[8, 22, 38, 58, 74, 90].map((x, i) => <b key={i} style={{ left: x + '%', ['--k' as string]: (1 + (i % 3) * 0.35) * (i % 2 ? -1 : 1) }} />)}</div>
          <div className="pole" />
          <div className="bench"><i /><i /><i /><i /></div>
        </div>
      </div>
    </Chapter>
  )
}

function engineVel() { return Math.max(-8, Math.min(8, engine.vel * 0.004)) }
