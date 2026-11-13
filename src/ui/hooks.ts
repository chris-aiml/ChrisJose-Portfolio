import { useEffect, useRef, useSyncExternalStore } from 'react'
import { getActive, subscribeActive } from '../scroll/scrollSystem'
import type { ChapterId } from '../content'

export const useActive = (): ChapterId => useSyncExternalStore(subscribeActive, getActive, getActive)

/** Adds `.in` to every `.rv` element once it enters the viewport. */
export function useReveal(root: React.RefObject<HTMLElement>, deps: unknown[] = []) {
  useEffect(() => {
    const els = Array.from((root.current ?? document).querySelectorAll<HTMLElement>('.rv:not(.in)'))
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** 'pin' = sticky 100svh acts (desktop), 'flow' = natural-flow sections (phones, short viewports). */
export function useLayoutMode() {
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px) and (min-height: 620px)')
    const set = () => { document.documentElement.dataset.layout = mq.matches ? 'pin' : 'flow' }
    set(); mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [])
}

export function useInView(ref: React.RefObject<Element>) {
  const v = useRef(true)
  useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => { v.current = e.isIntersecting }, { rootMargin: '80px' })
    io.observe(ref.current); return () => io.disconnect()
  }, [ref])
  return v
}
