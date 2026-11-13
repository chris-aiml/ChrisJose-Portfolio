import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { CHAPTERS, type ChapterId } from '../content'
import { engine, type SceneFn } from './engine'

/** A tall section with a sticky, viewport-high stage. The engine feeds `fn` the chapter progress each frame. */
export function Chapter({ id, children, className = '' }: { id: ChapterId; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const c = CHAPTERS.find((x) => x.id === id)!
  useEffect(() => engine.register(id, ref.current!), [id])
  return (
    <section ref={ref} id={'ch-' + id} className={'ch ' + className} style={{ ['--h' as string]: c.h, zIndex: CHAPTERS.indexOf(c) + 1 } as CSSProperties} aria-label={c.label} data-ch={id}>
      <div className="stick">{children}</div>
    </section>
  )
}

/** Subscribe to a chapter's progress. The callback may close over refs; it is re-bound when `deps` change. */
export function useScene(id: ChapterId, fn: SceneFn, deps: unknown[] = []) {
  const ref = useRef(fn); ref.current = fn
  useEffect(() => engine.on(id, (p, t, dt) => ref.current(p, t, dt)), [id, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps
}

/** true on phones / narrow windows, kept in a ref so scene callbacks can read it every frame */
export function useNarrow() {
  const r = useRef(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)')
    const set = () => { r.current = mq.matches }
    set(); mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [])
  return r
}
