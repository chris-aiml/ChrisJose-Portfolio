import { useRef } from 'react'
import { CONTACT, HARDWARE } from '../content'
import { Chapter, useScene } from '../story/Chapter'
import { engine } from '../story/engine'
import { clamp, easeInOut, lerp, sm } from '../story/palette'

/** Last stop. A circle of butter floods the screen, then the contact details and a giant wordmark roll in. */
export function Contact() {
  const flood = useRef<HTMLDivElement>(null)
  const pre = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const mq = useRef<HTMLDivElement>(null)
  const items = useRef<HTMLElement[]>([])

  useScene('contact', (p) => {
    const flow = document.documentElement.hasAttribute('data-flow')
    const f = flow ? 1 : easeInOut(clamp((p - 0.04) / 0.34))
    flood.current!.style.clipPath = `circle(${lerp(0, 150, f)}vmax at 50% 64%)`
    pre.current!.style.opacity = String(1 - sm(0.02, 0.2, p))
    const b = flow ? 1 : sm(0.3, 0.5, p)
    body.current!.style.opacity = String(b)
    items.current.forEach((el, i) => { if (!el) return; const u = flow ? 1 : sm(0.34 + i * 0.05, 0.5 + i * 0.05, p); el.style.opacity = String(u); el.style.transform = `translateY(${(1 - u) * 30}px)` })
    mq.current!.style.transform = `translate3d(${lerp(0, -38, flow ? 1 : clamp((p - 0.3) / 0.7))}%,0,0)`
  })

  const set = (i: number) => (e: HTMLElement | null) => { if (e) items.current[i] = e }
  return (
    <Chapter id="contact">
      <div className="contact stage-night">
        <div className="pre" ref={pre} aria-hidden><span className="mono">END OF THE LINE</span><b className="display">Last stop.</b></div>
        <div className="flood stage-butter" ref={flood}>
          <div className="cbody" ref={body}>
            <div className="ctop">
              <span className="label" ref={set(0)}>{CONTACT.index}</span>
              <h2 className="display" ref={set(1)}>Aspire to APM, Product Analyst, Business Analyst and Software Engineer roles.</h2>
              <div className="roles" ref={set(2)}>{CONTACT.roles.map((r) => <span className="tag" key={r}>{r}</span>)}</div>
              <p className="lede" ref={set(3)}>{CONTACT.relocation}</p>
            </div>
            <div className="clinks" ref={set(4)}>
              {CONTACT.links.map((l) => (
                <a key={l.label} href={l.href} target={l.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener">
                  <span className="mono">{l.label}</span><span className="t">{l.text}</span><span className="ar" aria-hidden>↗</span>
                </a>
              ))}
            </div>
          </div>
          <div className="wordmark" aria-hidden><div ref={mq}>{Array.from({ length: 4 }).map((_, i) => <span key={i}>CHRIS JOSE<i>✦</i></span>)}</div></div>
          <footer className="foot mono">
            <span>{CONTACT.footer}</span><span>{HARDWARE.rev}</span>
            <button onClick={() => engine.scrollTo('intro')}>Back to top ↑</button>
          </footer>
        </div>
      </div>
    </Chapter>
  )
}
