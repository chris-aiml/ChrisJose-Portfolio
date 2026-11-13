import { useEffect, useRef } from 'react'

const COLS = ['#FFD54A', '#FF7A9A', '#F3EBDD', '#9BE3C4']

/** A click punches out a little burst of paper confetti: ticket-punch circles and small ticket scraps. Off for reduced motion. */
export function Sparkle() {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = cv.current!, ctx = canvas.getContext('2d')!
    let dpr = 1, W = 0, H = 0, raf = 0, last = performance.now()
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; va: number; life: number; c: string; kind: number }
    const ps: P[] = []
    const resize = () => { dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr }
    resize(); window.addEventListener('resize', resize)
    const burst = (x: number, y: number) => {
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2, s = 140 + Math.random() * 300
        ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 90, r: 3 + Math.random() * 4.5, a: Math.random() * 6, va: (Math.random() - 0.5) * 16, life: 0.9 + Math.random() * 0.5, c: COLS[i % COLS.length], kind: i % 3 })
      }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) }
    }
    const frame = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000); last = now
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.life -= dt
        if (p.life <= 0) { ps.splice(i, 1); continue }
        p.vy += 620 * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = Math.min(1, p.life * 2.2)
        ctx.fillStyle = p.c; ctx.strokeStyle = '#1B1224'; ctx.lineWidth = 1.4
        if (p.kind === 0) { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); ctx.stroke() }
        else if (p.kind === 1) { ctx.fillRect(-p.r * 1.3, -p.r * 0.7, p.r * 2.6, p.r * 1.4); ctx.strokeRect(-p.r * 1.3, -p.r * 0.7, p.r * 2.6, p.r * 1.4) }
        else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); ctx.fillStyle = '#1B1224'; ctx.beginPath(); ctx.arc(0, 0, p.r * 0.38, 0, 6.283); ctx.fill() }
        ctx.restore()
      }
      raf = ps.length ? requestAnimationFrame(frame) : 0
    }
    const down = (e: PointerEvent) => { if (e.pointerType !== 'touch') burst(e.clientX, e.clientY) }
    window.addEventListener('pointerdown', down)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointerdown', down); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={cv} className="fx2d" aria-hidden />
}
