import { useEffect, useRef, useMemo } from 'react'
import { LEADERSHIP } from '../content'
import { Chapter, useScene, useNarrow } from '../story/Chapter'
import { C, clamp, lerp, sm, easeInOut, rnd } from '../story/palette'

const N = 900, TEAM = 200
interface Pts { x: Float32Array; y: Float32Array }
const empty = (): Pts => ({ x: new Float32Array(N), y: new Float32Array(N) })

/** Sample N points inside the glyphs of a string, normalised to -1..1 on x (aspect kept on y). */
function textPoints(txt: string, seed: number): Pts {
  const cw = 520, ch = 220, c = document.createElement('canvas'); c.width = cw; c.height = ch
  const g = c.getContext('2d')!
  g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.font = `800 ${ch * 0.95}px "Bricolage Grotesque Variable", system-ui, sans-serif`
  g.fillText(txt, cw / 2, ch / 2 + ch * 0.04)
  const d = g.getImageData(0, 0, cw, ch).data
  const cand: number[] = []
  for (let y = 0; y < ch; y += 3) for (let x = 0; x < cw; x += 3) if (d[(y * cw + x) * 4 + 3] > 128) cand.push(x, y)
  const r = rnd(seed), out = empty(), m = cand.length / 2
  for (let i = cand.length / 2 - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); for (let k = 0; k < 2; k++) { const t = cand[i * 2 + k]; cand[i * 2 + k] = cand[j * 2 + k]; cand[j * 2 + k] = t } }
  for (let i = 0; i < N; i++) { const k = i % m; out.x[i] = (cand[k * 2] / cw - 0.5) * 2; out.y[i] = (cand[k * 2 + 1] / cw - ch / cw / 2) * 2 }
  return out
}
function lemniscate(seed: number): Pts {
  const r = rnd(seed), o = empty()
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 6.2832 * 3 % 6.2832, s = Math.sin(a), d = 1 + s * s
    const w = (r() - 0.5) * 0.16
    o.x[i] = (Math.cos(a) / d) * 0.95 + w * Math.cos(a + 1.2); o.y[i] = ((s * Math.cos(a)) / d) * 0.95 * 1.0 + w * 0.7
  }
  return o
}
function gridPts(): Pts {
  const o = empty()
  for (let i = 0; i < N; i++) { o.x[i] = ((i % 30) / 29 - 0.5) * 2; o.y[i] = (Math.floor(i / 30) / 29 - 0.5) * 2 }
  return o
}

export function Leadership() {
  const cv = useRef<HTMLCanvasElement>(null)
  const cap = useRef<HTMLDivElement>(null)
  const tix = useRef<HTMLDivElement>(null)
  const side = useRef<HTMLDivElement>(null)
  const narrow = useNarrow()
  const st = useRef<{ W: number; H: number; dpr: number; digits: Pts; inf: Pts; grid: Pts; sx: Float32Array; sy: Float32Array; ox: Float32Array; oy: Float32Array; d: Float32Array; ptr: { x: number; y: number; on: boolean } } | null>(null)
  const capIdx = useRef(-1)
  const caps = useMemo(() => [
    ['900+', 'people led, directly and through the teams under me'],
    ['900', 'one crowd, counted'],
    ['∞', 'Infinity 2026 · 5,000+ attendees'],
    ['30 × 30', '200 of them were the Infinity team'],
  ], [])

  useEffect(() => {
    const canvas = cv.current!
    const r = rnd(4242)
    const sx = new Float32Array(N), sy = new Float32Array(N), d = new Float32Array(N)
    for (let i = 0; i < N; i++) { sx[i] = r(); sy[i] = r(); d[i] = r() }
    const ox = new Float32Array(N), oy = new Float32Array(N)
    const build = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const W = canvas.clientWidth, H = canvas.clientHeight
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
      st.current = { W, H, dpr, digits: textPoints('900', 5), inf: lemniscate(9), grid: gridPts(), sx, sy, ox, oy, d, ptr: st.current?.ptr ?? { x: -9999, y: -9999, on: false } }
    }
    const mkAll = () => { build() }
    mkAll(); const ro = new ResizeObserver(build); ro.observe(canvas)
    void document.fonts?.ready.then(build)
    const pm = (e: PointerEvent) => { const b = canvas.getBoundingClientRect(); if (st.current) { st.current.ptr.x = e.clientX - b.left; st.current.ptr.y = e.clientY - b.top; st.current.ptr.on = true } }
    const pl = () => { if (st.current) st.current.ptr.on = false }
    window.addEventListener('pointermove', pm); window.addEventListener('pointerleave', pl)
    return () => { ro.disconnect(); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerleave', pl) }
  }, [])

  useScene('leadership', (p, t, dt) => {
    const s = st.current; if (!s) return
    const { W, H, dpr } = s
    const nw = narrow.current
    const flow = document.documentElement.hasAttribute('data-flow')
    const g = cv.current!.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H)

    // chapter timeline
    const toDigits = easeInOut(clamp((p - 0.14) / 0.14))
    const toInf = easeInOut(clamp((p - 0.34) / 0.14))
    const toGrid = easeInOut(clamp((p - 0.54) / 0.16))
    const dock = easeInOut(clamp((p - 0.7) / 0.14))
    const ci = p < 0.3 ? 0 : p < 0.34 ? 1 : p < 0.54 ? 2 : 3
    const cIdx = p < 0.16 ? 0 : p < 0.34 ? 1 : p < 0.54 ? 2 : 3
    void ci
    if (cIdx !== capIdx.current) {
      capIdx.current = cIdx
      const el = cap.current!; el.dataset.i = String(cIdx)
      ;(el.firstElementChild as HTMLElement).textContent = caps[cIdx][0]; (el.lastElementChild as HTMLElement).textContent = caps[cIdx][1]
    }

    // where the cloud lives: centre first, then docked to the left (wide) or top (narrow)
    const big = Math.min(W * (nw ? 0.86 : 0.54), H * (nw ? 0.5 : 0.62))
    const cxC = W / 2, cyC = nw ? H * 0.42 : H * 0.5
    const small = nw ? Math.min(W * 0.74, H * 0.34) : Math.min(W * 0.34, H * 0.56)
    const cxD = nw ? W / 2 : W * 0.28, cyD = nw ? H * 0.4 : H * 0.54
    const cx = lerp(cxC, cxD, dock), cy = lerp(cyC, cyD, dock), sz = lerp(big, small, dock) / 2
    const gridSz = sz * (1 + 0.0)
    cap.current!.style.opacity = String(1 - dock)
    cap.current!.style.transform = `translateY(${dock * -20}px)`

    const sp = 4.6
    const pr = s.ptr
    g.fillStyle = C.paper
    for (let i = 0; i < N; i++) {
      const di = s.d[i] * 0.45
      const a = clamp((toDigits - di) / (1 - 0.45)), b = clamp((toInf - di) / 0.55), c = clamp((toGrid - di) / 0.55)
      const e1 = easeInOut(a), e2 = easeInOut(b), e3 = easeInOut(c)
      // scatter: drifting crowd, spread across the stage
      const dx = Math.sin(t * 0.0004 * (0.6 + s.d[i]) + i) * 14, dy = Math.cos(t * 0.00037 * (0.6 + s.d[i]) + i * 1.3) * 14
      let x = W * 0.02 + s.sx[i] * W * 0.96 + dx, y = H * 0.06 + s.sy[i] * H * 0.88 + dy
      x = lerp(x, cx + s.digits.x[i] * sz * 1.3, e1); y = lerp(y, cy + s.digits.y[i] * sz * 1.25, e1)
      x = lerp(x, cx + s.inf.x[i] * sz, e2); y = lerp(y, cy + s.inf.y[i] * sz * 0.6, e2)
      x = lerp(x, cx + s.grid.x[i] * gridSz * 0.96, e3); y = lerp(y, cy + s.grid.y[i] * gridSz * 0.96, e3)
      // pointer pushes dots away, they spring back
      s.ox[i] *= 0.9; s.oy[i] *= 0.9
      if (pr.on) { const ddx = x - pr.x, ddy = y - pr.y, dd = Math.hypot(ddx, ddy); if (dd < 90) { const f = (1 - dd / 90) * 3.2; s.ox[i] += (ddx / (dd + 0.01)) * f; s.oy[i] += (ddy / (dd + 0.01)) * f } }
      x += s.ox[i]; y += s.oy[i]
      const team = i < TEAM
      const rad = (team ? 3.6 : 2.7) * (nw ? 0.85 : 1) * lerp(1, 0.78 + 0.35 * (small / big), dock)
      const hot = team ? clamp(Math.max(sm(0.38, 0.46, p) * (1 - e3 * 0.0), 0)) : 0
      g.fillStyle = team && p > 0.4 ? C.rose : C.paper
      g.globalAlpha = team ? 1 : (p > 0.52 ? lerp(0.8, 0.45, e3) : 0.9)
      g.beginPath(); g.arc(x, y, rad + hot * 0.4, 0, 6.2832); g.fill()
    }
    g.globalAlpha = 1
    // tickets slide in at the end
    const tk = tix.current!
    const k = tk.children
    for (let i = 0; i < k.length; i++) {
      const u = flow ? 1 : easeInOut(clamp((p - 0.7 - i * 0.04) / 0.12))
      const el = k[i] as HTMLElement
      el.style.opacity = String(u); el.style.transform = `translateY(${(1 - u) * 60}px) rotate(${(1 - u) * (i % 2 ? 5 : -5)}deg)`
    }
    side.current!.style.opacity = String(flow ? 1 : sm(0.64, 0.76, p))
    void dt
  })

  const L = LEADERSHIP
  return (
    <Chapter id="leadership">
      <div className="lead stage-plum">
        <canvas ref={cv} className="fill" aria-hidden />
        <div className="lhead">
          <span className="label">{L.index}</span>
          <h2 className="display">{L.role}</h2>
          <p className="mono dim">{L.org} · {L.period}</p>
        </div>
        <div className="cap" ref={cap} aria-live="off"><b className="display" /><span /></div>
        <div className="lright">
        <div className="lside" ref={side}>
          <ul className="lhl">{L.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
          <p className="mono dim lalso">{L.also.join('  ·  ')}</p>
        </div>
        <div className="tix" ref={tix}>
          {L.stats.map((s, i) => (
            <div className={'tick' + (i === 1 ? ' hot' : '')} key={s.k}>
              <b className="display">{s.v}</b>
              <span className="mono">{s.k}</span>
              <em>{s.d}</em>
            </div>
          ))}
        </div>
        </div>
      </div>
    </Chapter>
  )
}
