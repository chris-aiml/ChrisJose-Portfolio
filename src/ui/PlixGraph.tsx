import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PLIX_EDGES, PLIX_NODES, type PlixNode } from '../content'

const VB = { w: 1230, h: 600 }
const ORDER = ['mood', 'moodtext', 'reference', 'product', 'direction', 'generate', 'final']
const INFO: Record<string, string> = {
  mood: 'Image inputs that set the mood for the ad.',
  moodtext: 'Text pulled from the mood board.',
  product: 'Where the product images go in.',
  reference: 'Reference inputs that set the look.',
  direction: 'The prompt node. It combines the mood, the reference and the product.',
  lock: 'Locked. The production prompts are withheld.',
  generate: 'Image generation.',
  final: 'Finished ads come out here.',
}
const byId = Object.fromEntries(PLIX_NODES.map((n) => [n.id, n])) as Record<string, PlixNode>

function anchor(a: PlixNode, b: PlixNode) {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
  const dx = bc.x - ac.x, dy = bc.y - ac.y
  // choose exit/entry sides from the dominant axis
  if (Math.abs(dx) > Math.abs(dy) * 0.55) {
    const s = dx > 0
    return { p0: { x: s ? a.x + a.w : a.x, y: ac.y }, p1: { x: s ? b.x : b.x + b.w, y: bc.y }, h: true }
  }
  const s = dy > 0
  return { p0: { x: ac.x, y: s ? a.y + a.h : a.y }, p1: { x: bc.x, y: s ? b.y : b.y + b.h }, h: false }
}
function pathD(a: PlixNode, b: PlixNode) {
  const { p0, p1, h } = anchor(a, b)
  const k = 0.5
  return h
    ? `M${p0.x},${p0.y} C${p0.x + (p1.x - p0.x) * k},${p0.y} ${p1.x - (p1.x - p0.x) * k},${p1.y} ${p1.x},${p1.y}`
    : `M${p0.x},${p0.y} C${p0.x},${p0.y + (p1.y - p0.y) * k} ${p1.x},${p1.y - (p1.y - p0.y) * k} ${p1.x},${p1.y}`
}

/** Simplified Figma Weave workflow. Hover/focus a node: its connected paths light up lime with travelling pulses. */
export function PlixGraph({ caption }: { caption: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [t, setT] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 600 ? { k: 2.1, x: 0, y: -165 } : { k: 1, x: 0, y: 0 }))
  const tRef = useRef(t); tRef.current = t
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null)
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ d: number; k: number } | null>(null)

  const edges = useMemo(() => PLIX_EDGES.map(([a, b, dashed], i) => ({ i, a, b, dashed: !!dashed, d: pathD(byId[a], byId[b]) })), [])
  const [sel, setSel] = useState<string | null>(null)
  const [run, setRun] = useState<{ step: number; fill: number } | null>(null)
  const movedRef = useRef(false)
  const focus = hover ?? sel
  const lit = useMemo(() => {
    if (run) {
      const ns = new Set(ORDER.slice(0, run.step + 1)), es = new Set<number>()
      edges.forEach((e) => { if (ns.has(e.a) && ns.has(e.b) && !e.dashed) es.add(e.i) })
      return { nodes: ns, edges: es, running: true }
    }
    if (!focus) return { nodes: new Set<string>(), edges: new Set<number>(), running: false }
    const ns = new Set<string>([focus]), es = new Set<number>()
    edges.forEach((e) => { if (e.a === focus || e.b === focus) { es.add(e.i); ns.add(e.a); ns.add(e.b) } })
    return { nodes: ns, edges: es, running: false }
  }, [focus, edges, run])
  // the workflow "runs": each stage lights in turn, then the finished ads fill in
  useEffect(() => {
    if (!run) return
    const t = window.setTimeout(() => {
      if (run.step < ORDER.length - 1) setRun({ step: run.step + 1, fill: 0 })
      else if (run.fill < 8) setRun({ step: run.step, fill: run.fill + 1 })
    }, run.step < ORDER.length - 1 ? 620 : 150)
    return () => window.clearTimeout(t)
  }, [run])
  const startRun = () => { setSel(null); setRun({ step: 0, fill: 0 }) }
  const finished = !!run && run.step === ORDER.length - 1 && run.fill >= 8
  const status = run
    ? finished ? 'Done. Finished ads are ready.' : `Running · ${byId[ORDER[run.step]].label}`
    : focus ? `${byId[focus].label}. ${INFO[focus]}` : 'Click a node to inspect it, or run the workflow.'

  const clamp = (v: { k: number; x: number; y: number }) => {
    const k = Math.min(3.2, Math.max(1, v.k))
    const r = box.current?.getBoundingClientRect(); const w = r?.width ?? VB.w, h = r?.height ?? VB.h
    const mx = (k - 1) * w, my = (k - 1) * h
    return { k, x: Math.min(0, Math.max(-mx, v.x)), y: Math.min(0, Math.max(-my, v.y)) }
  }
  const zoomAt = useCallback((f: number, cx?: number, cy?: number) => {
    const r = box.current!.getBoundingClientRect(); const o = tRef.current
    const px = cx ?? r.width / 2, py = cy ?? r.height / 2
    const k = Math.min(3.2, Math.max(1, o.k * f))
    setT(clamp({ k, x: px - ((px - o.x) / o.k) * k, y: py - ((py - o.y) / o.k) * k }))
  }, [])

  useEffect(() => {
    const el = box.current!
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault(); const r = el.getBoundingClientRect()
      zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const down = (e: React.PointerEvent) => {
    movedRef.current = false
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.current.size === 2) { const [a, b] = [...pts.current.values()]; pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), k: tRef.current.k }; drag.current = null }
    else drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false }
  }
  const move = (e: React.PointerEvent) => {
    if (pts.current.has(e.pointerId)) pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch.current && pts.current.size === 2) {
      const [a, b] = [...pts.current.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y)
      const r = box.current!.getBoundingClientRect()
      zoomAt((pinch.current.k * d) / pinch.current.d / tRef.current.k, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); return
    }
    const d = drag.current
    if (d && d.id === e.pointerId && tRef.current.k > 1) {
      const dx = e.clientX - d.x, dy = e.clientY - d.y
      if (Math.abs(dx) + Math.abs(dy) > 2) { d.moved = true; movedRef.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
      d.x = e.clientX; d.y = e.clientY
      if (d.moved) setT((o) => clamp({ ...o, x: o.x + dx, y: o.y + dy }))
    }
  }
  const up = (e: React.PointerEvent) => { pts.current.delete(e.pointerId); if (pts.current.size < 2) pinch.current = null; if (drag.current?.id === e.pointerId) drag.current = null }

  return (
    <div className="graphwrap">
    <div className="graph" ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onDoubleClick={() => setT({ k: 1, x: 0, y: 0 })} data-cursor="DRAG" role="group" aria-label="Simplified Figma Weave workflow diagram. Hover or focus a node to trace its connections.">
      <svg viewBox={`0 36 ${VB.w} ${VB.h - 70}`} preserveAspectRatio="xMidYMid meet" style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})`, transformOrigin: '0 0' }}>
        <g>
          {edges.map((e) => {
            const on = lit.edges.has(e.i); const dim = !lit.running && focus && !on
            const pulse = lit.running ? !!run && e.b === ORDER[run.step] && on : on
            return (
              <g key={e.i}>
                <path d={e.d} className={'ge' + (e.dashed ? ' dashed' : '') + (on ? ' lit' : '') + (dim ? ' dim' : '')} />
                <path d={e.d} className={'pulse' + (pulse ? ' on' : '')} />
              </g>
            )
          })}
          {PLIX_NODES.map((n) => {
            const on = lit.nodes.has(n.id); const dim = !lit.running && focus && !on
            return (
              <g key={n.id} className={'gn' + (on ? ' lit' : '') + (run && run.step < ORDER.length && n.id === ORDER[run.step] ? ' now' : '') + (sel === n.id && !run ? ' sel' : '') + (dim ? ' dim' : '') + (n.kind === 'locked' ? ' lock' : '')} tabIndex={0} role="button" aria-label={`${n.label}${n.sub ? ', ' + n.sub : ''}`}
                data-cursor="INSPECT" onClick={() => { if (!movedRef.current && !run) setSel((x) => (x === n.id ? null : n.id)) }} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setSel((x) => (x === n.id ? null : n.id)) } }} onPointerEnter={() => setHover(n.id)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}>
                <rect className="box" x={n.x} y={n.y} width={n.w} height={n.h} rx={8} />
                <text x={n.x + 14} y={n.y + 24} fontSize={13} fontWeight={600} letterSpacing=".02em">{n.label}</text>
                {n.sub && <text x={n.x + 14} y={n.y + 41} fontSize={10.5} opacity={0.6}>{n.sub}</text>}
                {n.slots && Array.from({ length: n.slots.count }).map((_, i) => {
                  const { cols, rows } = n.slots!
                  const gx = 10, top = 58, pad = 14
                  const cw = (n.w - pad * 2 - gx * (cols - 1)) / cols, ch = Math.min(cw, (n.h - top - pad - gx * (rows - 1)) / rows)
                  return <rect key={i} className={'slot' + (n.id === 'final' && run && i < run.fill ? ' fill' : '')} x={n.x + pad + (i % cols) * (cw + gx)} y={n.y + top + Math.floor(i / cols) * (ch + gx)} width={cw} height={ch} rx={4} />
                })}
                {n.kind === 'locked' && <g transform={`translate(${n.x + n.w / 2 - 12} ${n.y + 66})`} opacity={0.8}>
                  <rect x={2} y={11} width={20} height={15} rx={3} fill="none" stroke="#F4F4F0" strokeWidth={1.4} /><path d="M6 11V7a6 6 0 0 1 12 0v4" fill="none" stroke="#F4F4F0" strokeWidth={1.4} />
                </g>}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
      <div className="ginfo">
        <button className="pill lime" onClick={startRun} data-cursor={run ? 'RE-RUN' : 'RUN'} disabled={!!run && !finished}><i aria-hidden>▶</i>{finished ? 'Run again' : run ? 'Running' : 'Run workflow'}</button>
        <span className="gstat mono" aria-live="polite">{status}</span>
      </div>
      <div className="gbar mono">
        <span>{caption} <em>Figma Weave</em></span>
        <span className="gh">Hover to trace<span className="gx"> · Ctrl/⌘ + scroll to zoom · drag to pan</span></span>
        <div className="tools">
          <button aria-label="Zoom out" onClick={() => zoomAt(1 / 1.35)}>−</button>
          <button aria-label="Zoom in" onClick={() => zoomAt(1.35)}>+</button>
          <button aria-label="Reset view" onClick={() => setT({ k: 1, x: 0, y: 0 })}>⟲</button>
        </div>
      </div>
    </div>
  )
}
