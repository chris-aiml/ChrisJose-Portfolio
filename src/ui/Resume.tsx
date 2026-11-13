import { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CV_MGMT, CV_TECH, type CV } from '../content'
import { scroll } from '../scroll/scrollSystem'

const PRINT_TITLE = 'CJ-1307'

function Paper({ cv }: { cv: CV }) {
  return (
    <article className="cv-paper" aria-label={`${cv.tab} CV`}>
      <h1>{cv.name}</h1>
      <div className="contact-line">{cv.contact}</div>
      {cv.sections.map((s) => (
        <section key={s.title}>
          <h2>{s.title}</h2>
          {s.text && <p>{s.text}</p>}
          {s.rows && s.rows.map(([k, v]) => (<div className="skill" key={k}><b>{k}</b><span>{v}</span></div>))}
          {s.blocks && s.blocks.map((b, i) => (
            <div className="blk" key={i}>
              {(b.head || b.date) && <div className="row"><b>{b.head}</b>{b.date && <span className="d">{b.date}</span>}</div>}
              {b.sub && <div className="sub">{b.sub}</div>}
              {b.text && <p>{b.text}</p>}
              {b.bullets && <ul>{b.bullets.map((t) => <li key={t}>{t}</li>)}</ul>}
            </div>
          ))}
        </section>
      ))}
    </article>
  )
}

export function Resume() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'tech' | 'mgmt'>('tech')
  const closeBtn = useRef<HTMLButtonElement>(null)
  const prev = useRef<HTMLElement | null>(null)
  const old = useRef(document.title)

  useEffect(() => {
    const o = () => { prev.current = document.activeElement as HTMLElement; setOpen(true) }
    window.addEventListener('cj:cv', o)
    const before = () => { old.current = document.title === PRINT_TITLE ? old.current : document.title; document.title = PRINT_TITLE }
    const after = () => { document.title = old.current }
    window.addEventListener('beforeprint', before); window.addEventListener('afterprint', after)
    return () => { window.removeEventListener('cj:cv', o); window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after) }
  }, [])
  useEffect(() => {
    if (!open) return
    scroll.stop(); closeBtn.current?.focus()
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener('keydown', k); scroll.start(); prev.current?.focus?.() }
  }, [open])

  const cv = tab === 'tech' ? CV_TECH : CV_MGMT
  return createPortal(
    <div className={'cv-overlay' + (open ? ' open' : '')} role="dialog" aria-modal="true" aria-label="Curriculum vitae" aria-hidden={!open} data-lenis-prevent>
      <div className="cv-bar">
        <div className="tabs" role="tablist">
          {[CV_TECH, CV_MGMT].map((c) => (
            <button key={c.id} role="tab" aria-selected={tab === c.id} onClick={() => setTab(c.id)} tabIndex={open ? 0 : -1}>{c.tab}</button>
          ))}
        </div>
        <div className="acts">
          <button className="pill lime" onClick={() => window.print()} data-cursor="OPEN" tabIndex={open ? 0 : -1}>Print / Save A4 PDF</button>
          <button className="pill" ref={closeBtn} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>Close ✕</button>
        </div>
      </div>
      <Fragment key={tab}><Paper cv={cv} /></Fragment>
    </div>,
    document.body,
  )
}
