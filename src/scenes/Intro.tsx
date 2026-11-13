import { useEffect, useRef, useMemo } from 'react'
import { INTRO, BRAND } from '../content'
import { Chapter, useScene } from '../story/Chapter'
import { C, clamp, easeOut, easeInOut, rnd, sm } from '../story/palette'

const UW = 2520, UH = 380            // train drawing, in its own units
const DOOR_X = 930, DOOR_Y = 200     // centre of the doorway we zoom into
const CAR = 580
const GLYPHS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
/** In the tagline a ',' tile is drawn as the four-point star. */
const STAR = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 0C54 30 70 46 100 50C70 54 54 70 50 100C46 70 30 54 0 50C30 46 46 30 50 0Z"/></svg>'
const NAME = 'CHRIS JOSE', TAG = `${INTRO.line1.replace(',', '')} , ${INTRO.line2}`.toUpperCase(), STATUS = 'NOW BOARDING · STOP 02'

/** Split-flap board: every tile scrambles, then settles on its letter. */
function Row({ text, cls, base, step }: { text: string; cls: string; base: number; step: number }) {
  return (
    <div className={'frow ' + cls} aria-hidden>
      {text.split('').map((ch, i) => (
        <span key={i} className={'fl' + (ch === ' ' ? ' sp' : ch === ',' ? ' star' : '')} data-t={ch} data-r={(base + i * step).toFixed(3)} data-k="0"><b> </b></span>
      ))}
    </div>
  )
}

function TrainSVG() {
  const cars = [0, 1, 2, 3]
  return (
    <svg viewBox={`0 0 ${UW} ${UH}`} width={UW} height={UH} aria-hidden>
      <defs>
        <linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE38A" /><stop offset="1" stopColor="#FFC93A" /></linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".35" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <line x1="-200" y1="352" x2={UW + 200} y2="352" stroke={C.paper} strokeWidth="3" opacity=".55" />
      {cars.map((i) => {
        const x = 40 + i * (CAR + 20), last = i === 3
        const body = last
          ? `M${x},96 a26,26 0 0 1 26,-26 H${x + CAR - 40} C${x + CAR + 70},70 ${x + CAR + 120},210 ${x + CAR + 120},300 a20,20 0 0 1 -20,20 H${x + 26} a26,26 0 0 1 -26,-26 Z`
          : `M${x},96 a26,26 0 0 1 26,-26 H${x + CAR - 26} a26,26 0 0 1 26,26 V294 a26,26 0 0 1 -26,26 H${x + 26} a26,26 0 0 1 -26,-26 Z`
        const winXs = i === 1 ? [26, 108, 332, 414] : [26, 108, 190, 272, 354, 436]
        return (
          <g key={i}>
            <path d={body} fill={C.paper} />
            <rect x={x} y="76" width={CAR + (last ? 60 : 0)} height="14" fill="#D8CDBA" opacity=".7" />
            <path d={`M${x},258 H${x + CAR + (last ? 118 : 0)} V${last ? 300 : 294} a20,20 0 0 1 -20,20 H${x + 26} a26,26 0 0 1 -26,-26 Z`} fill={C.rose} />
            <text x={x + 24} y="296" fontFamily="JetBrains Mono Variable, monospace" fontWeight="700" fontSize="17" letterSpacing="3" fill={C.ink}>CJ EXPRESS · 0{i + 1}</text>
            {winXs.map((wx) => (
              <g key={wx}><rect x={x + wx} y="110" width="74" height="104" rx="16" fill="url(#win)" stroke={C.ink} strokeWidth="4" /><rect x={x + wx} y="110" width="74" height="104" rx="16" fill="url(#glass)" /></g>
            ))}
            {i === 1 && (
              <g>
                <rect className="door-in" x={x + 224} y="100" width="132" height="200" rx="8" fill="#3A2246" />
                <g className="door-l"><rect x={x + 224} y="100" width="66" height="200" rx="8" fill="#E6DAC6" stroke={C.ink} strokeWidth="4" /><rect x={x + 236} y="116" width="42" height="84" rx="12" fill="url(#win)" opacity=".9" /></g>
                <g className="door-r"><rect x={x + 290} y="100" width="66" height="200" rx="8" fill="#E6DAC6" stroke={C.ink} strokeWidth="4" /><rect x={x + 302} y="116" width="42" height="84" rx="12" fill="url(#win)" opacity=".9" /></g>
                <rect x={x + 214} y="92" width="152" height="12" rx="6" fill={C.butter} stroke={C.ink} strokeWidth="3" />
              </g>
            )}
            {last && <path d={`M${x + CAR + 6},110 C${x + CAR + 70},112 ${x + CAR + 96},170 ${x + CAR + 104},214 H${x + CAR + 6} Z`} fill="url(#win)" stroke={C.ink} strokeWidth="4" />}
            {[110, 450].map((bx) => [-30, 30].map((o) => (
              <g key={bx + o} className="wheel" data-cx={x + bx + o} data-cy="326" transform={`translate(${x + bx + o} 326)`}>
                <circle r="26" fill={C.ink} stroke={C.paper} strokeWidth="3" />
                <circle r="8" fill={C.butter} />
                <line x1="-22" y1="0" x2="22" y2="0" stroke={C.paper} strokeWidth="3" /><line x1="0" y1="-22" x2="0" y2="22" stroke={C.paper} strokeWidth="3" />
              </g>
            )))}
            {!last && <rect x={x + CAR} y="270" width="20" height="10" fill={C.ink} />}
          </g>
        )
      })}
    </svg>
  )
}

export function Intro() {
  const cv = useRef<HTMLCanvasElement>(null)
  const board = useRef<HTMLDivElement>(null)
  const trainBox = useRef<HTMLDivElement>(null)
  const cue = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const inside = useRef<HTMLDivElement>(null)
  const warp = useRef<{ W: number; H: number; dpr: number; r: Float32Array; a: Float32Array; v: Float32Array; col: Uint8Array; sz: Float32Array } | null>(null)
  const born = useRef(performance.now())
  const cells = useRef<{ el: HTMLElement; b: HTMLElement; t: string; r: number; shown: string; last: number }[]>([])
  const wheels = useRef<{ el: SVGGElement; cx: number; cy: number }[]>([])
  const parts = useRef<{ dl: SVGGElement; dr: SVGGElement }>({ dl: null as never, dr: null as never })
  const rot = useRef(0)
  const stars = useMemo(() => 340, [])

  useEffect(() => {
    const canvas = cv.current!
    const r = rnd(1307)
    const build = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const W = canvas.clientWidth, H = canvas.clientHeight
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
      const rr = new Float32Array(stars), a = new Float32Array(stars), v = new Float32Array(stars), sz = new Float32Array(stars); const col = new Uint8Array(stars)
      for (let i = 0; i < stars; i++) { rr[i] = Math.pow(r(), 0.7) * Math.hypot(W, H) * 0.55; a[i] = r() * 6.2832; v[i] = 0.4 + r() * 1.4; sz[i] = 0.6 + r() * 1.6; col[i] = r() < 0.12 ? 1 : r() < 0.2 ? 2 : 0 }
      warp.current = { W, H, dpr, r: rr, a, v, col, sz }
    }
    build(); const ro = new ResizeObserver(build); ro.observe(canvas)
    cells.current = Array.from(board.current!.querySelectorAll<HTMLElement>('.fl')).map((el) => ({ el, b: el.firstElementChild as HTMLElement, t: el.dataset.t!, r: parseFloat(el.dataset.r!), shown: ' ', last: 0 }))
    wheels.current = Array.from(trainBox.current!.querySelectorAll<SVGGElement>('.wheel')).map((el) => ({ el, cx: +el.dataset.cx!, cy: +el.dataset.cy! }))
    parts.current = { dl: trainBox.current!.querySelector('.door-l')!, dr: trainBox.current!.querySelector('.door-r')! }
    return () => ro.disconnect()
  }, [stars])

  useScene('intro', (p, t, dt) => {
    const w = warp.current; if (!w) return
    const flow = document.documentElement.hasAttribute('data-flow')
    // ---- timeline
    const auto = flow ? 1 : clamp((t - born.current) / 2600)
    const q = flow ? 1 : Math.max(p, auto * 0.34)                // board resolves by itself on load, then scroll continues it
    const speed = flow ? 0 : (1 - sm(0.26, 0.6, p)) * (p < 0.02 ? 0.8 + auto * 0.2 : 1)
    const arrive = flow ? 1 : easeOut(clamp((p - 0.12) / 0.46))                // train glides in and brakes
    const open = flow ? 1 : easeInOut(clamp((p - 0.62) / 0.1))
    const zoom = flow ? 0 : easeInOut(clamp((p - 0.74) / 0.26))

    // ---- warp / stars
    const c2 = cv.current!.getContext('2d')!
    c2.setTransform(w.dpr, 0, 0, w.dpr, 0, 0); c2.clearRect(0, 0, w.W, w.H)
    const cx = w.W / 2, cy = w.H * 0.46, R = Math.hypot(w.W, w.H) * 0.56
    const cols = [C.paper, C.rose, C.butter]
    c2.lineCap = 'round'
    for (let i = 0; i < stars; i++) {
      const adv = (w.r[i] * 0.045 + 1.2) * w.v[i] * speed * Math.min(dt, 0.05) * 60
      w.r[i] += adv
      if (w.r[i] > R) { w.r[i] = 6 + Math.random() * 40; w.a[i] = Math.random() * 6.2832 }
      const x = cx + Math.cos(w.a[i]) * w.r[i], y = cy + Math.sin(w.a[i]) * w.r[i]
      const len = Math.min(w.r[i] * 0.5, adv * 7 + 0.001)
      c2.strokeStyle = cols[w.col[i]]; c2.fillStyle = cols[w.col[i]]
      c2.globalAlpha = clamp(0.25 + w.r[i] / R) * (1 - zoom)
      if (len > 2.2) { c2.lineWidth = w.sz[i] * (0.6 + w.r[i] / R); c2.beginPath(); c2.moveTo(x, y); c2.lineTo(cx + Math.cos(w.a[i]) * (w.r[i] - len), cy + Math.sin(w.a[i]) * (w.r[i] - len)); c2.stroke() }
      else { c2.beginPath(); c2.arc(x, y, w.sz[i] * 0.9, 0, 6.2832); c2.fill() }
    }
    c2.globalAlpha = 1

    // ---- split-flap board
    for (const c of cells.current) {
      let ch = ' '
      if (c.t === ' ') ch = ' '
      else if (q >= c.r) ch = c.t
      else if (q > c.r - 0.07) ch = GLYPHS[Math.floor(((t * 0.013 + c.r * 977) % 1) * GLYPHS.length)]
      if (ch !== c.shown && (ch === c.t || t - c.last > 70)) {
        c.shown = ch; c.last = t
        if (ch === ',') c.b.innerHTML = STAR
        else c.b.textContent = ch === ' ' ? ' ' : ch
        c.el.dataset.k = c.el.dataset.k === '1' ? '0' : '1'
      }
    }
    board.current!.style.opacity = String(flow ? 1 : 1 - sm(0.66, 0.76, p))
    board.current!.style.transform = `translateY(${flow ? 0 : -sm(0.5, 0.74, p) * 40}px)`
    cue.current!.style.opacity = String(1 - sm(0.02, 0.1, p))

    // ---- train
    const box = trainBox.current!, stage = wrap.current!
    const vw = stage.clientWidth, vh = stage.clientHeight
    if (vw < 10 || vh < 10) return
    const hPx = Math.min(vh * 0.31, vw * 0.22 + 90)
    const s = hPx / UH
    box.style.width = UW * s + 'px'; box.style.height = hPx + 'px'
    const svg = box.firstElementChild as SVGElement; svg.style.width = UW * s + 'px'; svg.style.height = hPx + 'px'
    const txStop = vw / 2 - DOOR_X * s, txStart = -UW * s - 80
    const tx = txStart + (txStop - txStart) * arrive
    const Z = Math.exp(Math.log(18) * zoom)
    const ty = vh - hPx - Math.max(28, vh * 0.07)
    box.style.transformOrigin = `${DOOR_X * s}px ${DOOR_Y * s}px`
    box.style.transform = `translate(${tx}px, ${ty - (zoom * (ty + DOOR_Y * s - vh / 2))}px) scale(${Z})`
    // wheels roll with the distance travelled
    const dist = (tx - txStart) / s
    rot.current = (dist / 26) * 57.3
    for (const wh of wheels.current) wh.el.setAttribute('transform', `translate(${wh.cx} ${wh.cy}) rotate(${rot.current})`)
    parts.current.dl.setAttribute('transform', `translate(${-open * 62} 0)`)
    parts.current.dr.setAttribute('transform', `translate(${open * 62} 0)`)
    inside.current!.style.opacity = String(sm(0.8, 0.96, zoom))
    box.style.visibility = zoom > 0.995 ? 'hidden' : 'visible'
  })

  return (
    <Chapter id="intro">
      <div className="intro stage-night" ref={wrap}>
        <canvas ref={cv} className="fill" aria-hidden />
        <h1 className="sr">{BRAND.name}. {INTRO.line1} {INTRO.line2}</h1>
        <div className="board" ref={board}>
          <Row text={NAME} cls="r1" base={0.03} step={0.016} />
          <Row text={TAG} cls="r2" base={0.17} step={0.011} />
          <Row text={STATUS} cls="r3" base={0.2} step={0.006} />
        </div>
        <div className="train" ref={trainBox} aria-hidden><TrainSVG /></div>
        <div className="inside" ref={inside} aria-hidden />
        <div className="cue mono" ref={cue} aria-hidden><i />Scroll to board</div>
      </div>
    </Chapter>
  )
}
