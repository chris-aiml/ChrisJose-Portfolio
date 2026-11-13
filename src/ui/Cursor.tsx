import { useEffect, useRef } from 'react'

const SEL = 'a[href],button,[role="button"],[role="tab"],input,select,textarea,summary,[data-cursor]'

/**
 * Sticker cursor.
 *  - one orange dot with an ink outline and a cream halo, so it reads on navy and on cream alike
 *  - it is placed straight from the pointer event: no spring, no lag, no offset, so it can never drift off the pointer
 *  - over something clickable a dashed ring spins up around the same centre; on press the dot squashes
 *  - the sparkle trail and click bursts live in <Sparkle />
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const el = root.current!
    const html = document.documentElement
    let hot: Element | null = null
    let seen = false
    const hotOf = (t: EventTarget | null): Element | null => {
      const e = (t as Element | null)?.closest?.(SEL) as HTMLElement | null
      if (!e) return null
      const r = e.getBoundingClientRect()
      return r.width > 640 || r.height > 300 ? null : e
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      el.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`
      if (!seen) { seen = true; html.classList.add('cur-live') }
      const h = hotOf(e.target)
      if (h !== hot) { hot = h; el.classList.toggle('hot', !!h) }
    }
    const down = (e: PointerEvent) => { if (e.pointerType !== 'touch') el.classList.add('press') }
    const up = () => el.classList.remove('press')
    const leave = () => { html.classList.remove('cur-live'); seen = false; hot = null; el.classList.remove('hot', 'press') }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    html.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      html.removeEventListener('pointerleave', leave)
      html.classList.remove('cur-live')
    }
  }, [])
  return (
    <div ref={root} className="cur" aria-hidden>
      <i className="ring" />
      <i className="core" />
    </div>
  )
}
