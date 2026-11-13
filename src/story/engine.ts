import Lenis from 'lenis'
import type { ChapterId } from '../content'

/** Called every frame while a chapter is on screen. p = progress through the chapter's pinned travel (0..1). */
export type SceneFn = (p: number, t: number, dt: number) => void

interface Entry { id: ChapterId; el: HTMLElement; fns: Set<SceneFn>; top: number; h: number; p: number; shown: boolean }

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))

/**
 * One scroll engine for the whole story.
 * Every chapter is a tall section holding a sticky, viewport-high stage. The engine turns the scroll position into a
 * 0..1 progress per chapter and hands it to that chapter's scene, so each scene can animate in its own way.
 * `flow` mode (reduced motion or ?static) skips smooth scrolling and shows every scene in its finished state.
 */
class Engine {
  lenis: Lenis | null = null
  entries = new Map<ChapterId, Entry>()
  order: ChapterId[] = []
  y = 0
  vel = 0
  progress = 0
  active: ChapterId = 'intro'
  flow = false
  ready = false
  private raf = 0
  private last = 0
  private listeners = new Set<() => void>()
  private bar: HTMLElement | null = null
  private ro: ResizeObserver | null = null
  private onResize = () => this.measure()

  init(flow: boolean) {
    if (this.ready) return
    this.flow = flow
    try { history.scrollRestoration = 'manual' } catch { /* noop */ }
    window.scrollTo(0, 0)
    if (!flow) this.lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.62, smoothWheel: true, autoRaf: false })
    this.bar = document.getElementById('cj-progress')
    this.ready = true
    this.measure()
    window.addEventListener('resize', this.onResize)
    window.addEventListener('load', this.onResize)
    this.ro = new ResizeObserver(() => this.measure()); this.ro.observe(document.body)
    void document.fonts?.ready.then(() => this.measure())
    const loop = (t: number) => { this.raf = requestAnimationFrame(loop); this.tick(t) }
    this.raf = requestAnimationFrame(loop)
  }

  register(id: ChapterId, el: HTMLElement) {
    const e: Entry = { id, el, fns: new Set(), top: 0, h: 1, p: 0, shown: false }
    this.entries.set(id, e)
    this.order = [...this.entries.keys()]
    this.measure()
    return () => { this.entries.delete(id); this.order = [...this.entries.keys()] }
  }

  on(id: ChapterId, fn: SceneFn) {
    const add = () => this.entries.get(id)?.fns.add(fn)
    add()
    // finished-state render for flow mode, and a first paint before the first scroll
    queueMicrotask(() => { const e = this.entries.get(id); if (e) fn(this.flow ? 1 : e.p, performance.now(), 0.016) })
    return () => { this.entries.get(id)?.fns.delete(fn) }
  }

  measure() {
    if (!this.ready) return
    for (const e of this.entries.values()) {
      e.top = e.el.getBoundingClientRect().top + window.scrollY
      e.h = e.el.offsetHeight
    }
  }

  private travel(e: Entry) { return Math.max(1, e.h - window.innerHeight) }

  tick(t: number) {
    const dt = Math.min(0.05, Math.max(0.001, (t - (this.last || t - 16)) / 1000)); this.last = t
    this.lenis?.raf(t)
    const y = this.lenis ? this.lenis.scroll : window.scrollY
    this.vel = (y - this.y) / Math.max(dt, 0.001); this.y = y
    const vh = window.innerHeight
    const docH = Math.max(1, document.documentElement.scrollHeight - vh)
    this.progress = clamp(y / docH)
    if (this.bar) this.bar.style.transform = `scaleX(${this.progress.toFixed(4)})`

    let active: ChapterId = this.order[0] ?? 'intro'
    for (const e of this.entries.values()) {
      const p = this.flow ? 1 : clamp((y - e.top) / this.travel(e))
      const near = this.flow || (y + vh * 1.15 > e.top && y < e.top + e.h + vh * 0.15)
      e.p = p
      if (near) {
        e.el.style.setProperty('--p', p.toFixed(4))
        for (const fn of e.fns) fn(p, t, dt)
        e.shown = true
      } else if (e.shown) {
        // leave the scene in its end state once it is far away
        const final = y < e.top ? 0 : 1
        e.el.style.setProperty('--p', String(final))
        for (const fn of e.fns) fn(final, t, dt)
        e.shown = false
      }
      if (y + vh * 0.5 >= e.top) active = e.id
    }
    if (active !== this.active) { this.active = active; this.listeners.forEach((l) => l()) }
  }

  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l) } }
  getActive = () => this.active

  scrollTo(id: ChapterId) {
    const e = this.entries.get(id); if (!e) return
    const y = id === 'intro' ? 0 : e.top + 2
    if (this.lenis) this.lenis.scrollTo(y, { duration: 1.8, easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) })
    else window.scrollTo({ top: y, behavior: 'smooth' })
  }

  /** smooth scroll to a point inside a chapter */
  scrollToP(id: ChapterId, p: number) {
    const e = this.entries.get(id); if (!e) return
    const y = e.top + clamp(p) * this.travel(e)
    if (this.lenis) this.lenis.scrollTo(y, { duration: 1.4, easing: (t: number) => 1 - Math.pow(1 - t, 3) }); else window.scrollTo({ top: y, behavior: 'smooth' })
  }

  /** instant jump, for checking a scene at a given progress */
  jump(id: ChapterId, p: number) {
    const e = this.entries.get(id); if (!e) return
    const y = e.top + clamp(p) * this.travel(e)
    if (this.lenis) this.lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y)
    this.tick(performance.now())
  }

  stop() { this.lenis?.stop() }
  start() { this.lenis?.start() }
  destroy() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize); window.removeEventListener('load', this.onResize)
    this.ro?.disconnect(); this.lenis?.destroy(); this.lenis = null; this.ready = false
  }
}

export const engine = new Engine()
