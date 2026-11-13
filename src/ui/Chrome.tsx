import { useState, useSyncExternalStore } from 'react'
import { BRAND, CHAPTERS, type ChapterId } from '../content'
import { engine } from '../story/engine'

export const openCV = () => window.dispatchEvent(new CustomEvent('cj:cv'))
const useActive = (): ChapterId => useSyncExternalStore(engine.subscribe, engine.getActive, engine.getActive)

/** Brand, current-stop pill, CV button and the route-map rail (one station per chapter). */
export function Chrome({ interactive = true }: { interactive?: boolean }) {
  const active = useActive()
  const [open, setOpen] = useState(false)
  const idx = CHAPTERS.findIndex((c) => c.id === active)
  const cur = CHAPTERS[Math.max(0, idx)]
  const go = (id: ChapterId) => { setOpen(false); engine.scrollTo(id) }
  return (
    <>
      <div id="cj-progress" aria-hidden />
      <a className="brand" href="#ch-intro" onClick={(e) => { e.preventDefault(); go('intro') }} aria-label="Chris Jose, product, systems, design. Back to the start">
        <b>CJ</b> {BRAND.name} <span className="t">// {BRAND.tag}</span>
      </a>
      <div className="topr">
        {interactive && <span className="pill" aria-live="polite"><i className="dot" />Stop {cur.n} · {cur.label}</span>}
        <button className="pill pri" onClick={openCV} data-cursor="OPEN">CV</button>
        {interactive && <button className="pill only-mobile" aria-expanded={open} onClick={() => setOpen(!open)}>Stops</button>}
      </div>
      {interactive && (
        <nav className="rail" aria-label="Stops">
          {CHAPTERS.map((c, i) => (
            <button key={c.id} className={(c.id === active ? 'on ' : '') + (i < idx ? 'past' : '')} onClick={() => go(c.id)} aria-label={`${c.n} ${c.label}`} aria-current={c.id === active}>
              <span className="lab">{c.n} · {c.label}</span><i />
            </button>
          ))}
        </nav>
      )}
      {interactive && (
        <div className={'index-panel' + (open ? ' open' : '')} aria-hidden={!open}>
          {CHAPTERS.map((c) => (
            <button key={c.id} className={c.id === active ? 'on' : ''} onClick={() => go(c.id)} tabIndex={open ? 0 : -1}>
              <span className="idx">{c.n}</span><span className="display">{c.label[0] + c.label.slice(1).toLowerCase()}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
