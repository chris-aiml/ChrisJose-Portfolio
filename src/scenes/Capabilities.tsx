import { useEffect, useRef } from 'react'
import { PILLARS } from '../content'
import { Chapter, useScene, useNarrow } from '../story/Chapter'
import { clamp, lerp, sm } from '../story/palette'

const SKIN = ['paper', 'butter', 'mint', 'paper', 'butter', 'mint']
const N = PILLARS.length
const station = (u: number) => { const f = Math.floor(u), r = u - f; return f + sm(0.22, 0.78, r) }

/** The train from the hardware chapter, now five carriages long. It stops at each station and the carriage in view is the pillar. */
export function Capabilities() {
  const track = useRef<HTMLDivElement>(null)
  const cars = useRef<HTMLElement[]>([])
  const wheels = useRef<SVGElement[]>([])
  const far = useRef<HTMLDivElement>(null)
  const mid = useRef<HTMLDivElement>(null)
  const sleepers = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const pips = useRef<HTMLElement[]>([])
  const narrow = useNarrow()
  const geo = useRef({ cw: 600, gap: 54 })

  useEffect(() => {
    const root = track.current!
    cars.current = Array.from(root.querySelectorAll<HTMLElement>('.car'))
    wheels.current = Array.from(root.querySelectorAll<SVGElement>('.wh'))
    pips.current = Array.from(document.querySelectorAll<HTMLElement>('.capprog i'))
    const fit = () => { const w = root.parentElement!.clientWidth; const cw = Math.min(w * 0.86, 660); geo.current = { cw, gap: Math.max(34, cw * 0.09) }; root.style.setProperty('--cw', cw + 'px'); root.style.setProperty('--gap', geo.current.gap + 'px') }
    fit(); const ro = new ResizeObserver(fit); ro.observe(root.parentElement!)
    return () => ro.disconnect()
  }, [])

  useScene('capabilities', (p) => {
    const flow = document.documentElement.hasAttribute('data-flow')
    const { cw, gap } = geo.current
    const W = track.current!.parentElement!.clientWidth
    const u = flow ? 0 : station(clamp((p - 0.03) / 0.94) * (N - 1))
    const x = W / 2 - cw / 2 - u * (cw + gap)
    // the train arrives from the left (it left the hardware stop to the right, so it loops in from behind)
    const arrive = flow ? 1 : sm(0, 0.07, p)
    track.current!.style.transform = `translate3d(${x - (1 - arrive) * W * 1.1}px,0,0)`
    cars.current.forEach((c, i) => {
      const d = i - u, a = Math.abs(d)
      c.style.setProperty('--d', d.toFixed(3))
      c.style.transform = `translateY(${Math.min(1, a) * 18}px) scale(${1 - Math.min(1, a) * 0.07})`
      c.style.opacity = String(1 - Math.min(1, a) * 0.1)
      c.classList.toggle('now', a < 0.4)
    })
    const rot = (u * (cw + gap)) / 21 * 57.3 + (1 - arrive) * 600
    wheels.current.forEach((w) => w.style.transform = `rotate(${rot}deg)`)
    far.current!.style.transform = `translate3d(${-u * (cw + gap) * 0.12}px,0,0)`
    mid.current!.style.transform = `translate3d(${-u * (cw + gap) * 0.3}px,0,0)`
    sleepers.current!.style.transform = `translate3d(${-((u * (cw + gap)) % 60)}px,0,0)`
    const idx = clamp(Math.round(u), 0, N - 1)
    if (count.current) count.current.textContent = `0${idx + 1} / 0${N}`
    pips.current.forEach((el, i) => el.classList.toggle('on', i <= idx))
    void narrow
  })

  return (
    <Chapter id="capabilities">
      <div className="caps stage-rose">
        <div className="capfar" ref={far} aria-hidden />
        <div className="capmid" ref={mid} aria-hidden />
        <div className="capshead">
          <span className="label">07 / CAPABILITIES</span>
          <span className="mono capn" ref={count}>{`01 / 0${N}`}</span>
        </div>
        <div className="captrack" aria-hidden={false}>
          <div className="trainrow" ref={track}>
            {PILLARS.map((c, i) => (
              <article className={'car skin-' + SKIN[i]} key={c.n} aria-label={c.title}>
                <div className="roof" />
                <div className="cabin">
                  <div className="carhd"><b className="mono">{c.n}</b><h3 className="display">{c.title}</h3></div>
                  <p className="carline">{c.line}</p>
                  <div className="chips">{c.chips.map((x) => <span key={x}>{x}</span>)}{'progress' in c && c.progress ? c.progress.map((x) => <span key={x} className="prog">{x} · in progress</span>) : null}</div>
                  <ul className="carev">{c.evidence.map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
                <div className="skirt"><span className="mono">CJ EXPRESS · 0{i + 1}</span></div>
                <svg className="axle" viewBox="0 0 400 44" aria-hidden>
                  {[90, 310].map((cx) => (
                    <g key={cx} transform={`translate(${cx} 22)`}><g className="wh" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}><circle r="21" fill="#1B1224" /><circle r="7" fill="#FFD54A" /><line x1="-17" x2="17" stroke="#F3EBDD" strokeWidth="3" /><line y1="-17" y2="17" stroke="#F3EBDD" strokeWidth="3" /></g></g>
                  ))}
                </svg>
                {i < PILLARS.length - 1 && <span className="coupler" />}
              </article>
            ))}
          </div>
        </div>
        <div className="rails" aria-hidden><div className="sleepers" ref={sleepers} /><i /></div>
        <div className="capprog" aria-hidden>{PILLARS.map((c) => <i key={c.n} />)}</div>
      </div>
    </Chapter>
  )
}
