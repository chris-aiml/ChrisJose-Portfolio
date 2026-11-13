import { useRef } from 'react'
import { Chapter, useScene } from '../story/Chapter'
import { clamp, easeOut, sm } from '../story/palette'
import { openCV } from '../ui/Chrome'

const PASSES = [
  { tab: 'TECH', line: 'Agentic workflows · LLM tool-calling · Python', seat: '14A', skin: 'butter' },
  { tab: 'MANAGEMENT', line: 'Cross-functional teams · Events · Stakeholders', seat: '14B', skin: 'rose' },
]

/** Two boarding passes are printed out of a slot as you scroll. Each one opens a CV. */
export function ResumeScene() {
  const passes = useRef<HTMLButtonElement[]>([])
  const slot = useRef<HTMLDivElement>(null)
  const txt = useRef<HTMLDivElement>(null)

  useScene('resume', (p) => {
    const flow = document.documentElement.hasAttribute('data-flow')
    passes.current.forEach((el, i) => {
      if (!el) return
      const u = flow ? 1 : easeOut(clamp((p - 0.1 - i * 0.22) / 0.42))
      const rest = i === 0 ? -1 : 1
      const y = (1 - u) * -120
      el.style.setProperty('--u', u.toFixed(3))
      el.style.transform = `translateY(${y}%) rotate(${rest * (1 - u) * 0 + rest * u * 4.2}deg) translateX(${rest * u * 6}%)`
      el.style.opacity = u > 0.01 ? '1' : '0'
      el.style.pointerEvents = u > 0.9 ? 'auto' : 'none'
    })
    if (slot.current) slot.current.style.setProperty('--glow', String(sm(0.05, 0.2, p) * (1 - sm(0.7, 0.9, p))))
    if (txt.current) { const a = flow ? 1 : sm(0.02, 0.14, p); txt.current.style.opacity = String(a); txt.current.style.transform = `translateY(${(1 - a) * 24}px)` }
  })

  return (
    <Chapter id="resume">
      <div className="resume stage-night">
        <div className="rtxt" ref={txt}>
          <span className="label rose">08 / RESUME</span>
          <h2 className="display">One person, two CVs.</h2>
          <p className="lede">A Tech version and a Management version. Read it here, or save it as an A4 PDF.</p>
          <div className="acts">
            <button className="btn" onClick={() => openCV()}><span>Open CV</span><span aria-hidden>↗</span></button>
            <button className="btn ghost" onClick={() => { openCV(); window.setTimeout(() => window.print(), 450) }}><span>Save A4 PDF</span></button>
          </div>
        </div>
        <div className="printer">
          <div className="rslot" ref={slot}><i /></div>
          <div className="passes">
            {PASSES.map((x, i) => (
              <button key={x.tab} ref={(e) => { if (e) passes.current[i] = e }} className={'pass skin-' + x.skin} onClick={() => openCV()} aria-label={`Open the ${x.tab.toLowerCase()} CV`}>
                <div className="pmain">
                  <span className="mono">BOARDING PASS · CJ EXPRESS</span>
                  <b className="display">{x.tab}</b>
                  <p>{x.line}</p>
                  <div className="pfields"><span><em className="mono">PASSENGER</em>CHRIS JOSE</span><span><em className="mono">SEAT</em>{x.seat}</span><span><em className="mono">REF</em>CJ-1307</span></div>
                </div>
                <div className="pstub"><i className="bars" /><span className="mono">OPEN ↗</span></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Chapter>
  )
}
