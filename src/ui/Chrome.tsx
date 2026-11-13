import { useState } from 'react'
import { BRAND, CHAPTERS } from '../content'
import { scroll } from '../scroll/scrollSystem'
import { useActive } from './hooks'

export const openCV = () => window.dispatchEvent(new CustomEvent('cj:cv'))

export function Chrome({ interactive = true }: { interactive?: boolean }) {
  const active = useActive()
  const [open, setOpen] = useState(false)
  const cur = CHAPTERS.find((c) => c.id === active)!
  const go = (id: (typeof CHAPTERS)[number]['id']) => { setOpen(false); scroll.scrollToChapter(id) }
  return (
    <>
      <div id="cj-progress" aria-hidden />
      <a className="brand" href="#chapter-intro" onClick={(e) => { e.preventDefault(); go('intro') }} aria-label="Chris Jose, product, systems, design. Back to top">
        <b>{BRAND.mark}</b> {BRAND.name} <span className="t">// {BRAND.tag}</span>
      </a>
      <div className="topr">
        {interactive && <span className="pill" aria-live="polite"><i className="dot" />{cur.n} / {cur.label}</span>}
        <button className="pill lime" onClick={openCV} data-cursor="OPEN">CV</button>
        {interactive && <button className="pill only-mobile" aria-expanded={open} onClick={() => setOpen(!open)}>Index</button>}
      </div>
      {interactive && (
        <nav className="rail" aria-label="Chapters">
          {CHAPTERS.map((c) => (
            <button key={c.id} className={c.id === active ? 'on' : ''} onClick={() => go(c.id)} aria-label={`${c.n} ${c.label}`} aria-current={c.id === active}>
              <span className="lab">{c.n} {c.label}</span><span className="tick" />
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
