import Lenis from 'lenis'
import { sheet } from '../theatre/sheet'
import { SEQ_LEN } from '../theatre/acts'
import { CHAPTERS, type ChapterId } from '../content'

/** Mutable, read every frame by the 3D scene and the UI chrome. */
export const scrollState = {
  /** damped, normalised progress 0..1 that drives sheet.sequence.position */
  p: 0,
  /** raw (undamped) progress implied by the scroll position */
  target: 0,
  y: 0,
  active: 'intro' as ChapterId,
}

type Listener = () => void
const listeners = new Set<Listener>()
export const subscribeActive = (l: Listener) => { listeners.add(l); return () => { listeners.delete(l) } }
export const getActive = () => scrollState.active

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))

/**
 * Scroll → Theatre sequence.
 *  1. Lenis (lerp 0.08, wheelMultiplier 0.85) smooths the wheel into scroll position.
 *  2. Scroll position maps LINEARLY to normalised progress. Anchors sit at each chapter
 *     (measured from the DOM) so camera acts stay aligned with their chapters at any viewport.
 *  3. A frame-rate-independent damper (time-constant ≈ 70 ms) removes residual jitter.
 *  4. sheet.sequence.position = progress × SEQ_LEN. Keyframes are linear, so one wheel turn
 *     always moves the camera the same amount.
 */
class ScrollSystem {
  lenis: Lenis | null = null
  private ys: number[] = [0, 1]
  private ps: number[] = [0, 1]
  private pins: { el: HTMLElement; top: number; h: number; last: number }[] = []
  private last = 0
  private reduced = false
  private ro: ResizeObserver | null = null
  private onResize = () => this.measure()
  private progressEl: HTMLElement | null = null
  ready = false

  init(reduced: boolean) {
    if (this.ready) return
    this.reduced = reduced
    try { history.scrollRestoration = 'manual' } catch { /* noop */ }
    window.scrollTo(0, 0)
    if (!reduced) {
      this.lenis = new Lenis({
        lerp: 0.08,
        wheelMultiplier: 0.85,
        smoothWheel: true,
        autoRaf: false, // single RAF: we call lenis.raf() from the render loop
      })
    }
    this.progressEl = document.getElementById('cj-progress')
    this.measure()
    window.addEventListener('resize', this.onResize)
    this.ro = new ResizeObserver(() => this.measure())
    this.ro.observe(document.body)
    void document.fonts?.ready.then(() => this.measure())
    window.addEventListener('load', this.onResize)
    this.ready = true
  }

  measure() {
    const vh = window.innerHeight
    const limit = Math.max(1, document.documentElement.scrollHeight - vh)
    const ys: number[] = [], ps: number[] = []
    this.pins = []
    CHAPTERS.forEach((c, i) => {
      const el = document.getElementById('chapter-' + c.id)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY
      let y = i === 0 ? 0 : Math.max(0, top - vh * 0.5)
      if (ys.length) y = Math.max(y, ys[ys.length - 1] + 1)
      y = Math.min(y, limit - (CHAPTERS.length - i)) // keep room for the remaining anchors
      ys.push(y); ps.push(c.p)
      if (c.pin) this.pins.push({ el, top, h: el.offsetHeight, last: -1 })
    })
    ys.push(limit); ps.push(1)
    this.ys = ys; this.ps = ps
  }

  /** piecewise-linear scroll position → normalised progress */
  map(y: number) {
    const { ys, ps } = this
    if (y <= ys[0]) return ps[0]
    for (let i = 0; i < ys.length - 1; i++) {
      if (y <= ys[i + 1]) return ps[i] + ((y - ys[i]) / (ys[i + 1] - ys[i])) * (ps[i + 1] - ps[i])
    }
    return 1
  }

  /** scroll offset (px) at which chapter `id` becomes the active act */
  yFor(id: ChapterId) {
    const i = CHAPTERS.findIndex((c) => c.id === id)
    return this.ys[i] ?? 0
  }

  update(timeMs: number) {
    if (!this.ready) return
    const dt = Math.min(0.05, Math.max(0.001, (timeMs - (this.last || timeMs - 16)) / 1000))
    this.last = timeMs
    this.lenis?.raf(timeMs)
    const y = this.lenis ? this.lenis.scroll : window.scrollY
    const target = this.map(y)
    scrollState.y = y
    scrollState.target = target
    let p = scrollState.p
    if (this.reduced) p = target
    else {
      p += (target - p) * (1 - Math.exp(-14 * dt))
      if (Math.abs(target - p) < 2e-5) p = target
    }
    scrollState.p = p
    sheet.sequence.position = clamp(p) * SEQ_LEN

    if (this.progressEl) this.progressEl.style.transform = `scaleX(${p.toFixed(4)})`

    // chapter-local progress for pinned chapters (drives CSS fades)
    const vh = window.innerHeight
    for (const pin of this.pins) {
      const lp = clamp((y - pin.top) / Math.max(1, pin.h - vh))
      if (Math.abs(lp - pin.last) > 0.0008) { pin.el.style.setProperty('--lp', lp.toFixed(4)); pin.last = lp }
    }

    let active: ChapterId = CHAPTERS[0].id
    for (const c of CHAPTERS) if (p >= c.p - 1e-6) active = c.id
    if (active !== scrollState.active) { scrollState.active = active; listeners.forEach((l) => l()) }
  }

  scrollToChapter(id: ChapterId) {
    const y = this.yFor(id) + (id === 'intro' ? 0 : 2)
    if (this.lenis) this.lenis.scrollTo(y, { duration: 1.6, easing: (t: number) => t * t * (3 - 2 * t) })
    else window.scrollTo({ top: y, behavior: 'smooth' })
  }

  /** instant jump, used by verification tooling */
  jumpToProgress(p: number) {
    const { ys, ps } = this
    let y = ys[ys.length - 1]
    for (let i = 0; i < ps.length - 1; i++) {
      if (p <= ps[i + 1]) { y = ys[i] + ((p - ps[i]) / (ps[i + 1] - ps[i])) * (ys[i + 1] - ys[i]); break }
    }
    if (this.lenis) this.lenis.scrollTo(y, { immediate: true, force: true })
    else window.scrollTo(0, y)
    scrollState.p = p
  }

  stop() { this.lenis?.stop() }
  start() { this.lenis?.start() }

  destroy() {
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('load', this.onResize)
    this.ro?.disconnect()
    this.lenis?.destroy(); this.lenis = null
    this.ready = false
  }
}

export const scroll = new ScrollSystem()
