import { useEffect, useRef } from 'react'

const SEL = '[data-cursor],a[href],button,[role="button"],input,select,textarea,summary'
const MAG = '.pill,.btn'
const cache = new WeakMap<Element, boolean>()
/** True when the pointer is over a light surface (bone tiles, white paper, lime buttons), where a lime cursor would vanish. */
function onLight(t: Element | null): boolean {
  for (let n = t; n; n = n.parentElement) {
    const hit = cache.get(n); if (hit !== undefined) return hit
    const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g)
    if (m && (m.length < 4 || +m[3] > 0.6)) {
      const [r, g, b] = m.map(Number)
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
      const light = lum > 0.5
      cache.set(n, light); return light
    }
  }
  return false
}

/**
 * Targeting-reticle cursor.
 *  - lime dot: exact pointer
 *  - ring with rotating tick marks: spring-lagged, stretches along its velocity
 *  - corner brackets: spring-snap onto the interactive element under the pointer
 *  - label tag: tells you what the click does
 *  - click: a ripple ring
 *  - buttons and pills pull gently toward the pointer
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const tag = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const d = dot.current!, r = ring.current!, bx = box.current!, tg = tag.current!
    const p = { x: -100, y: -100 }
    const rg = { x: -100, y: -100, vx: 0, vy: 0 }
    const b = { x: 0, y: 0, w: 40, h: 40, vx: 0, vy: 0, vw: 0, vh: 0, tx: 0, ty: 0, tw: 40, th: 40, on: false }
    let seen = false, label = '', raf = 0, last = performance.now(), hotEl: HTMLElement | null = null, magEl: HTMLElement | null = null
    const setHot = (on: boolean) => { r.classList.toggle('hot', on); d.classList.toggle('hot', on) }
    const setLabel = (l: string) => { if (l !== label) { label = l; tg.textContent = l; tg.classList.toggle('on', !!l) } }
    const unmag = () => { if (magEl) { magEl.style.transform = ''; magEl.style.transition = 'transform .5s cubic-bezier(.2,.7,.1,1)'; magEl = null } }

    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      p.x = e.clientX; p.y = e.clientY
      if (!seen) { seen = true; rg.x = p.x; rg.y = p.y; b.x = p.x; b.y = p.y; document.documentElement.classList.add('cur-live') }
      document.documentElement.classList.toggle('cur-ink', onLight(e.target as Element | null))
      const el = (e.target as Element | null)?.closest?.(SEL) as HTMLElement | null
      if (el !== hotEl) {
        hotEl = el
        unmag()
        if (el) {
          const br = el.getBoundingClientRect()
          const large = br.width > 640 || br.height > 300
          b.on = !large
          if (b.on) { b.tx = br.left - 7; b.ty = br.top - 7; b.tw = br.width + 14; b.th = br.height + 14 }
          bx.classList.toggle('on', b.on)
          setHot(true); setLabel(el.dataset.cursor ?? '')
          if (br.width < 320 && el.matches(MAG)) { magEl = el; el.style.transition = 'transform .15s linear' }
        } else { b.on = false; bx.classList.remove('on'); setHot(false); setLabel('') }
      }
      if (magEl) {
        const br = magEl.getBoundingClientRect()
        const mx = Math.max(-9, Math.min(9, (p.x - (br.left + br.width / 2)) * 0.18)), my = Math.max(-5, Math.min(5, (p.y - (br.top + br.height / 2)) * 0.25))
        magEl.style.transform = `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px)`
      }
      if (el && b.on) { const br = el.getBoundingClientRect(); b.tx = br.left - 7; b.ty = br.top - 7; b.tw = br.width + 14; b.th = br.height + 14 }
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      r.classList.add('press')
      const rp = document.createElement('div'); rp.className = 'cur-ripple'
      rp.style.left = e.clientX + 'px'; rp.style.top = e.clientY + 'px'
      document.body.appendChild(rp); rp.addEventListener('animationend', () => rp.remove())
    }
    const up = () => r.classList.remove('press')
    const leave = () => { document.documentElement.classList.remove('cur-live'); seen = false; unmag(); hotEl = null; b.on = false; bx.classList.remove('on') }
    const scrolled = () => { if (hotEl && b.on) { const br = hotEl.getBoundingClientRect(); b.tx = br.left - 7; b.ty = br.top - 7; b.tw = br.width + 14; b.th = br.height + 14 } }

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now
      rg.vx += ((p.x - rg.x) * 260 - rg.vx * 24) * dt; rg.vy += ((p.y - rg.y) * 260 - rg.vy * 24) * dt
      rg.x += rg.vx * dt; rg.y += rg.vy * dt
      const sp = Math.hypot(rg.vx, rg.vy), ang = Math.atan2(rg.vy, rg.vx) * 57.2958
      const st = Math.min(0.55, sp / 2600), sx = 1 + st, sy = 1 / Math.sqrt(sx)
      d.style.transform = `translate3d(${p.x}px,${p.y}px,0)`
      r.style.transform = `translate3d(${rg.x}px,${rg.y}px,0) rotate(${ang.toFixed(1)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`
      tg.style.transform = `translate3d(${rg.x + 24}px,${rg.y + 20}px,0)`
      // bracket box springs
      const k = 330, c = 27
      b.vx += ((b.tx - b.x) * k - b.vx * c) * dt; b.vy += ((b.ty - b.y) * k - b.vy * c) * dt
      b.vw += ((b.tw - b.w) * k - b.vw * c) * dt; b.vh += ((b.th - b.h) * k - b.vh * c) * dt
      b.x += b.vx * dt; b.y += b.vy * dt; b.w += b.vw * dt; b.h += b.vh * dt
      bx.style.transform = `translate3d(${b.x}px,${b.y}px,0)`
      bx.style.width = Math.max(8, b.w) + 'px'; bx.style.height = Math.max(8, b.h) + 'px'
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down); window.addEventListener('pointerup', up)
    window.addEventListener('scroll', scrolled, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf); unmag()
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up)
      window.removeEventListener('scroll', scrolled); document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [])
  return (
    <>
      <div ref={box} className="cur-box" aria-hidden><i /><i /><i /><i /></div>
      <div ref={ring} className="cur-ring" aria-hidden>
        <div className="in">
          <svg viewBox="-20 -20 40 40" width="40" height="40">
            <circle r="14" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" />
            <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M0,-18 V-12" /><path d="M18,0 H12" /><path d="M0,18 V12" /><path d="M-18,0 H-12" />
            </g>
          </svg>
        </div>
      </div>
      <div ref={dot} className="cur-dot" aria-hidden />
      <div ref={tag} className="cur-tag" aria-hidden />
    </>
  )
}
