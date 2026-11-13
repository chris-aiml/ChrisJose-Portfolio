import type { CSSProperties } from 'react'
import {
  ABOUT, CHAPTERS, CONTACT, HARDWARE, INTRO, LEADERSHIP, LUCEN, PILLARS, PLIX, type ChapterId,
} from '../content'
import { PlixGraph } from './PlixGraph'
import { PlixLogo } from './PlixLogo'
import { PulseTease } from './PulseTease'
import { openCV } from './Chrome'
import { S } from '../scene/store'
import { scroll } from '../scroll/scrollSystem'
import { useEffect, useRef, useState } from 'react'

const BASE = import.meta.env.BASE_URL
const d = (i: number): CSSProperties => ({ ['--d' as string]: `${i * 0.09}s` })

function Ch({ id, children, flow = false }: { id: ChapterId; children: React.ReactNode; flow?: boolean }) {
  const c = CHAPTERS.find((x) => x.id === id)!
  return (
    <section id={'chapter-' + id} className={'chapter' + (flow ? ' nopad nat' : '')} style={{ ['--h' as string]: c.h } as CSSProperties} aria-label={c.label}>
      {children}
    </section>
  )
}


const GLYPHS = 'ABCDEFGHJKLMNPRSTUVXYZ0123456789#/\\<>+'
/** Big name. Letters shy away from the pointer, light up lime and scramble through glyphs before settling back. */
function HeroName() {
  const ref = useRef<HTMLHeadingElement>(null)
  const text = 'CHRIS JOSE'
  useEffect(() => {
    const el = ref.current!
    const ls = Array.from(el.querySelectorAll<HTMLElement>('.hl'))
    const busy = new Set<number>()
    const scramble = (i: number) => {
      if (busy.has(i)) return
      busy.add(i); const orig = text[i]; let n = 0
      const tick = () => {
        if (n++ > 7) { ls[i].textContent = orig; busy.delete(i); return }
        ls[i].textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        window.setTimeout(tick, 42)
      }
      tick()
    }
    const near = new Set<number>()
    const mv = (e: PointerEvent) => {
      ls.forEach((l, i) => {
        if (text[i] === ' ') return
        const r = l.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const dx = cx - e.clientX, dy = cy - e.clientY, dd = Math.hypot(dx, dy) || 1
        const k = Math.exp(-((dd / 120) ** 2))
        l.style.setProperty('--dx', ((dx / dd) * k * 8).toFixed(1) + 'px'); void dy
        l.style.setProperty('--s', (1 + k * 0.08).toFixed(3))
        const on = k > 0.42
        l.classList.toggle('near', on)
        if (on && !near.has(i)) { near.add(i); scramble(i) } else if (!on) near.delete(i)
      })
    }
    const lv = () => ls.forEach((l) => { l.style.setProperty('--dx', '0px'); l.style.setProperty('--dy', '0px'); l.style.setProperty('--s', '1'); l.classList.remove('near') })
    const tap = () => ls.forEach((_, i) => text[i] !== ' ' && window.setTimeout(() => scramble(i), i * 45))
    const host = el.parentElement!
    host.addEventListener('pointermove', mv); host.addEventListener('pointerleave', lv); el.addEventListener('click', tap)
    return () => { host.removeEventListener('pointermove', mv); host.removeEventListener('pointerleave', lv); el.removeEventListener('click', tap) }
  }, [])
  return (
    <h1 className="hname rv" ref={ref} aria-label="Chris Jose">
      {text.split('').map((c, i) => <span key={i} className={'hl' + (c === ' ' ? ' sp' : '')} aria-hidden>{c === ' ' ? '\u00a0' : c}</span>)}
    </h1>
  )
}

/** Counts up once, the first time it scrolls into view. */
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(0)
  useEffect(() => {
    const el = ref.current!
    if (document.documentElement.hasAttribute('data-static') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return }
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect(); const t0 = performance.now()
      const loop = (now: number) => { const k = Math.min(1, (now - t0) / 1400); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(loop) }
      raf = requestAnimationFrame(loop)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [to])
  return <div className="big" ref={ref} aria-label={`${to}${suffix}`}>{v}{suffix}</div>
}

export function Intro() {
  return (
    <Ch id="intro">
      <div className="pin">
        <div className="col intro">
          <span className="idx rv">{INTRO.index}</span>
          <HeroName />
          <p className="display tagline rv" style={d(1)}>{INTRO.line1} <span className="l2">{INTRO.line2}</span></p>
        </div>
        <div className="scrollcue mono" aria-hidden><i />Scroll</div>
      </div>
    </Ch>
  )
}


/** Words light up one by one as you scroll through the chapter, so the paragraph is read, not skimmed. */
function Kinetic({ paras }: { paras: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  let n = 0
  const words = paras.map((p) => p.split(/\s+/).map((w) => ({ w, i: n++ })))
  useEffect(() => {
    const el = ref.current!
    const static_ = document.documentElement.hasAttribute('data-static') || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (static_) { el.style.setProperty('--sp', '1'); return }
    const nodes = Array.from(el.querySelectorAll<HTMLElement>('.w'))
    const chapter = document.getElementById('chapter-about')
    let raf = 0, inView = true, lastSp = -1, hot = -1
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting }); io.observe(el)
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!inView) return
      const vh = window.innerHeight
      let sp: number
      if (document.documentElement.dataset.layout === 'pin' && chapter) {
        const r = chapter.getBoundingClientRect()
        sp = (-r.top / Math.max(1, r.height - vh) - 0.05) / 0.6
      } else {
        const r = el.getBoundingClientRect()
        sp = (vh * 0.82 - r.top) / (r.height + vh * 0.1)
      }
      sp = Math.min(1, Math.max(0, sp))
      if (Math.abs(sp - lastSp) < 0.002) return
      lastSp = sp; el.style.setProperty('--sp', sp.toFixed(3))
      const h = sp >= 1 || sp <= 0 ? -1 : Math.floor(sp * (n + 6)) - 2
      if (h !== hot) { nodes[hot]?.classList.remove('hot'); hot = h; nodes[hot]?.classList.add('hot') }
    }
    loop()
    return () => { cancelAnimationFrame(raf); io.disconnect() }
  }, [n])
  return (
    <div className="kin" ref={ref} style={{ ['--n' as string]: n + 6, ['--sp' as string]: 0 } as CSSProperties}>
      {words.map((ws, pi) => (
        <p key={pi}>
          {ws.map(({ w, i }) => (<span key={i}><span className={'w' + (/\d/.test(w) ? ' num' : '')} style={{ ['--i' as string]: i } as CSSProperties}>{w}</span>{' '}</span>))}
        </p>
      ))}
    </div>
  )
}

export function About() {
  return (
    <Ch id="about">
      <div className="pin">
        <div className="col wide">
          <div className="about">
            <div>
              <span className="idx rv">{ABOUT.index}</span>
              <h2 className="display rv" style={d(1)}>{ABOUT.headline}</h2>
              <Kinetic paras={ABOUT.paragraphs} />
              <a className="certlink rv" style={d(2)} href={ABOUT.cert.href} target="_blank" rel="noopener" data-cursor="OPEN PDF"><i aria-hidden /><span>{ABOUT.cert.label}</span><em>{ABOUT.cert.sub}</em><b aria-hidden>↗</b></a>
              <div className="bar rv" style={d(2)}>{ABOUT.bar}</div>
              <p className="music rv" style={d(3)}>{ABOUT.music}</p>
            </div>
          </div>
        </div>
      </div>
    </Ch>
  )
}

export function Leadership() {
  return (
    <Ch id="leadership">
      <div className="pin">
        <div className="col wide lead">
          <span className="idx rv">{LEADERSHIP.index}</span>
          <h2 className="display rv" style={d(1)}>{LEADERSHIP.role}</h2>
          <p className="role rv" style={d(2)}>{LEADERSHIP.org} · {LEADERSHIP.period}</p>
          <div className="stats">
            {LEADERSHIP.stats.map((s, i) => (
              <div key={s.k} className={'stat rv' + (i === 3 ? ' hot' : '')} style={d(3 + i)}>
                <div className="v">{s.v}</div><div><div className="k">{s.k}</div><div className="d">{s.d}</div></div>
              </div>
            ))}
          </div>
          <ul className="hl">{LEADERSHIP.highlights.map((h, i) => <li className="rv" style={d(i)} key={h}>{h}</li>)}</ul>
          <div className="also rv">{LEADERSHIP.also.map((a) => <span key={a}>{a}</span>)}</div>
        </div>
      </div>
    </Ch>
  )
}


export function Plix() {
  const [num, ...rest] = PLIX.stat.split(' ')
  const n = parseInt(num, 10)
  return (
    <Ch id="plix">
      <div className="pin">
        <div className="col full plix">
          <div className="head">
            <div>
              <span className="idx rv">{PLIX.index}</span>
              <h2 className="display rv" style={d(1)}>{PLIX.role}</h2>
              <div className="who rv" style={d(2)}><PlixLogo /><span className="mono dim">{PLIX.period} · {PLIX.status}</span></div>
            </div>
            <div className="rv" style={d(2)}>
              <CountUp to={n} suffix="%" />
              <p className="bigcap">{rest.join(' ')} <em>{PLIX.statTag}</em></p>
            </div>
          </div>
          <div className="rv" style={d(3)}><PlixGraph caption={PLIX.caption} /></div>
          <ul>{PLIX.points.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      </div>
    </Ch>
  )
}

export function Lucen() {
  return (
    <Ch id="lucen">
      <div className="pin">
        <div className="lucen">
          <div className="txt col">
            <span className="idx rv">{LUCEN.index}</span>
            <h2 className="display rv" style={d(1)}>{LUCEN.title}</h2>
            <p className="sub rv" style={d(2)}>{LUCEN.sub}</p>
            <p className="lede rv" style={d(3)}>{LUCEN.body}</p>
            <span className="disc rv" style={d(4)}>{LUCEN.disclaimer}</span>
          </div>
          <div className="ptease rv" style={d(2)}><PulseTease /></div>
        </div>
      </div>
    </Ch>
  )
}

export function StaticDevice() {
  const parts = [
    { y: 14, n: 'Fan module', h: 22, mesh: false }, { y: 52, n: 'Upper mesh band', h: 18, mesh: true }, { y: 88, n: 'Sensor core', h: 34, dark: true },
    { y: 140, n: 'Outer shell, display glass, handle', h: 44 }, { y: 202, n: 'Lower mesh band', h: 18, mesh: true }, { y: 238, n: 'Base ring', h: 16 },
  ] as { y: number; n: string; h: number; mesh?: boolean; dark?: boolean }[]
  return (
    <svg className="static-device" viewBox="0 0 520 290" role="img" aria-label="Illustrative exploded view of the device concept: fan, mesh bands, sensor core, shell with display glass and handle, base ring">
      <line x1="110" y1="6" x2="110" y2="282" stroke="#D2FF00" strokeOpacity=".7" strokeDasharray="3 5" />
      {parts.map((p) => (
        <g key={p.n}>
          <path d={`M60,${p.y} v${p.h} a50,12 0 0 0 100,0 v-${p.h} z`} fill={p.dark ? '#17181b' : p.mesh ? '#8d8e92' : '#4d4e52'} stroke="#F4F4F0" strokeOpacity=".4" />
          <ellipse cx="110" cy={p.y} rx="50" ry="12" fill={p.dark ? '#222327' : '#6a6b70'} stroke="#F4F4F0" strokeOpacity=".4" />
          <line x1="170" y1={p.y + p.h / 2 + 6} x2="236" y2={p.y + p.h / 2 + 6} stroke="#D2FF00" />
          <text x="244" y={p.y + p.h / 2 + 10} fill="#F4F4F0" fontFamily="JetBrains Mono, monospace" fontSize="11">{p.n}</text>
        </g>
      ))}
      <rect x="78" y="158" width="40" height="20" rx="5" fill="#050506" stroke="#F4F4F0" strokeOpacity=".3" /><circle cx="86" cy="172" r="2.4" fill="#ff3b30" />
    </svg>
  )
}

export function Hardware({ staticMode = false }: { staticMode?: boolean }) {
  const [ex, setEx] = useState(false)
  return (
    <Ch id="hardware">
      <div className="pin">
        <div className="col hw">
          <span className="idx rv">{HARDWARE.index}</span>
          <h2 className="display rv" style={d(1)}>{HARDWARE.title}</h2>
          <dl className="meta rv" style={d(2)}>{HARDWARE.meta.map(([k, v]) => <Fragment2 key={k} k={k} v={v} />)}</dl>
          <ol className="parts rv" style={d(3)}>{HARDWARE.parts.map((p, i) => <li key={p}><span>0{i + 1}</span>{p}</li>)}</ol>
          {!staticMode && (
            <div className="hwrow rv" style={d(4)}>
              <button className="pill" aria-pressed={ex} data-cursor="EXPLORE" onClick={() => { const v = !ex; setEx(v); S.manual.target = v ? 1 : 0 }}>
                <i className="dot" />{ex ? 'Assemble' : 'Exploded view'}
              </button>
              <span className="mono dim">Or keep scrolling</span>
            </div>
          )}
          {staticMode && <StaticDevice />}
          <p className="cap mono rv" style={d(5)}>{HARDWARE.caption}</p>
        </div>
      </div>
    </Ch>
  )
}
function Fragment2({ k, v }: { k: string; v: string }) { return (<><dt>{k}</dt><dd>{v}</dd></>) }

export function Capabilities() {
  return (
    <Ch id="capabilities" flow>
      <div className="flow"><div className="sec">
        <span className="idx rv">07 / CAPABILITIES</span>
        <h2 className="display rv" style={d(1)}>What I bring to a product team.</h2>
        <div className="bento">
          {PILLARS.map((p, i) => (
            <article key={p.n} className={'tile rv ' + p.surface} style={d(i)}>
              <span className="n">{p.n}</span>
              <h3>{p.title}</h3>
              <p className="line">{p.line}</p>
              <div className="chips">
                {p.chips.map((c, j) => <span key={c} className={'chip' + (p.n === '03' && j === 0 ? ' lead' : '')}>{c}</span>)}
                {'progress' in p && p.progress.map((c) => <span key={c} className="chip prog">{c}<small>In Progress</small></span>)}
              </div>
              <ul className="ev">{p.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
            </article>
          ))}
        </div>
      </div></div>
    </Ch>
  )
}

export function ResumeSection() {
  return (
    <Ch id="resume" flow>
      <div className="flow"><div className="sec">
        <div className="cvsec">
          <div>
            <span className="idx rv">08 / RESUME</span>
            <h2 className="display rv" style={d(1)}>One person, two CVs.</h2>
            <p className="lede rv" style={d(2)}>A Tech version and a Management version. Read it here, or save it as an A4 PDF.</p>
            <div className="acts rv" style={d(3)}>
              <button className="pill lime" onClick={openCV} data-cursor="OPEN">Open CV</button>
              <button className="pill" onClick={() => { openCV(); window.setTimeout(() => window.print(), 450) }} data-cursor="PRINT">Save A4 PDF</button>
            </div>
          </div>
          <div className="papers rv" style={d(2)} aria-hidden>
            {['TECH', 'MANAGEMENT'].map((k, n) => (
              <div className={'paper-mini p' + n} key={k}>
                <span className="mono tg">{k}</span>
                <b>CHRIS JOSE</b><span className="mono id">CJ-1307</span>
                <i className="k" /><i /><i /><i style={{ width: '82%' }} />
                <i className="k" /><i /><i style={{ width: '90%' }} /><i style={{ width: '70%' }} />
                <i className="k" /><i /><i style={{ width: '60%' }} />
              </div>
            ))}
          </div>
        </div>
      </div></div>
    </Ch>
  )
}

export function Contact() {
  return (
    <Ch id="contact" flow>
      <div className="flow cwrap">
        <div className="sec contact">
          <div className="cgrid">
            <div className="cl">
              <span className="idx rv">{CONTACT.index}</span>
              <h2 className="display rv" style={d(1)}>Open to APM, Product Analyst and Business Analyst roles.</h2>
              <div className="roles rv" style={d(2)}>{CONTACT.roles.map((r) => <span className="tag" key={r}>{r}</span>)}<span className="tag ghost">{CONTACT.location}</span></div>
              <p className="lede rv" style={d(3)}>{CONTACT.relocation}</p>
            </div>
            <div className="links rv" style={d(3)}>
              {CONTACT.links.map((l) => (
                <a key={l.label} href={l.href} target={l.href.startsWith('mailto') ? undefined : '_blank'} rel="noopener" data-cursor="OPEN">
                  <span className="mono dim">{l.label}</span><span className="t">{l.text}</span><span className="ar" aria-hidden>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <footer className="foot mono">
          <span>{CONTACT.footer}</span><span>{HARDWARE.rev}</span>
          <button onClick={() => scroll.scrollToChapter('intro')} data-cursor="TOP">Back to top ↑</button>
        </footer>
      </div>
    </Ch>
  )
}
