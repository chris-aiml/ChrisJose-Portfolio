import { useEffect, useMemo, useRef } from 'react'
import { PLIX, PLIX_EDGES, PLIX_NODES, type PlixNode } from '../content'
import { Chapter, useScene, useNarrow } from '../story/Chapter'
import { PlixLogo } from '../ui/PlixLogo'
import { C, clamp, lerp, sm, easeOut } from '../story/palette'

const VB = { w: 1230, h: 600 }
const byId = Object.fromEntries(PLIX_NODES.map((n) => [n.id, n])) as Record<string, PlixNode>
const FILL: Record<PlixNode['kind'], string> = { inputs: C.butter, process: C.rose, locked: C.ink, output: C.mint }
const RUN0 = 0.08, RUN1 = 0.8

function anchor(a: PlixNode, b: PlixNode) {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
  const dx = bc.x - ac.x, dy = bc.y - ac.y
  if (Math.abs(dx) > Math.abs(dy) * 0.55) { const s = dx > 0; return { p0: { x: s ? a.x + a.w : a.x, y: ac.y }, p1: { x: s ? b.x : b.x + b.w, y: bc.y }, h: true } }
  const s = dy > 0
  return { p0: { x: ac.x, y: s ? a.y + a.h : a.y }, p1: { x: bc.x, y: s ? b.y : b.y + b.h }, h: false }
}
function pathD(a: PlixNode, b: PlixNode) {
  const { p0, p1, h } = anchor(a, b), k = 0.5
  return h
    ? `M${p0.x},${p0.y} C${p0.x + (p1.x - p0.x) * k},${p0.y} ${p1.x - (p1.x - p0.x) * k},${p1.y} ${p1.x},${p1.y}`
    : `M${p0.x},${p0.y} C${p0.x},${p0.y + (p1.y - p0.y) * k} ${p1.x},${p1.y - (p1.y - p0.y) * k} ${p1.x},${p1.y}`
}

export function Plix() {
  const svg = useRef<SVGSVGElement>(null)
  const head = useRef<SVGGElement>(null)
  const status = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLElement>(null)
  const stat = useRef<HTMLDivElement>(null)
  const run = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLElement>(null)
  const narrow = useNarrow()
  const nodeEls = useRef<Record<string, SVGGElement>>({})
  const edgeEls = useRef<{ path: SVGPathElement; pk: SVGCircleElement; a: PlixNode; b: PlixNode; dashed: boolean; len: number }[]>([])
  const slotEls = useRef<{ el: SVGRectElement; node: string; i: number; kind: PlixNode['kind'] }[]>([])
  const lastLabel = useRef('')
  const edges = useMemo(() => PLIX_EDGES.map(([a, b, dashed], i) => ({ i, a, b, dashed: !!dashed, d: pathD(byId[a], byId[b]) })), [])

  useEffect(() => {
    const el = svg.current!
    edgeEls.current = edges.map((e) => {
      const path = el.querySelector<SVGPathElement>(`#pe${e.i}`)!, pk = el.querySelector<SVGCircleElement>(`#pk${e.i}`)!
      const len = path.getTotalLength(); path.style.strokeDasharray = `${len}`; path.style.strokeDashoffset = `${len}`
      return { path, pk, a: byId[e.a], b: byId[e.b], dashed: e.dashed, len }
    })
    slotEls.current = Array.from(el.querySelectorAll<SVGRectElement>('.sl')).map((s) => ({ el: s, node: s.dataset.n!, i: +s.dataset.i!, kind: byId[s.dataset.n!].kind }))
    nodeEls.current = Object.fromEntries(Array.from(el.querySelectorAll<SVGGElement>('.gn')).map((g) => [g.dataset.id!, g]))
  }, [edges])

  useScene('plix', (p, t) => {
    const flow = document.documentElement.hasAttribute('data-flow')
    const rp = flow ? 1 : clamp((p - RUN0) / (RUN1 - RUN0))
    const X = lerp(-30, VB.w + 20, rp)                 // playhead position in graph units
    const sv = svg.current!
    // camera: whole graph on wide screens, follows the run on phones
    if (narrow.current) {
      const vw = 470, x0 = clamp(X - vw * 0.62, 0, VB.w - vw)
      sv.setAttribute('viewBox', `${x0.toFixed(1)} 30 ${vw} 560`)
    } else sv.setAttribute('viewBox', `0 30 ${VB.w} 560`)
    head.current!.setAttribute('transform', `translate(${X} 0)`)
    head.current!.style.opacity = String(rp > 0 && rp < 1 ? 1 : 0)

    let now = ''
    for (const n of PLIX_NODES) {
      const lit = flow ? 1 : sm(n.x - 6, n.x + 40, X)
      const g = nodeEls.current[n.id]; if (!g) continue
      g.style.setProperty('--lit', lit.toFixed(3))
      g.classList.toggle('lit', lit > 0.5)
      if (X > n.x && X < n.x + n.w) now = n.label
    }
    for (const e of edgeEls.current) {
      const x0 = e.a.x + e.a.w, x1 = e.b.x
      const pr = flow ? 1 : e.dashed ? clamp((X - x0 + 220) / 260) : clamp((X - x0) / Math.max(40, x1 - x0 + 30))
      e.path.style.strokeDashoffset = String(e.len * (1 - pr))
      e.path.classList.toggle('on', pr > 0.02)
      // a packet rides the edge while the playhead is still moving through it
      const riding = !e.dashed && pr > 0.02 && pr < 0.999 && !flow
      e.pk.style.opacity = riding ? '1' : '0'
      if (riding) { const pt = e.path.getPointAtLength(e.len * pr); e.pk.setAttribute('cx', String(pt.x)); e.pk.setAttribute('cy', String(pt.y)) }
    }
    const fin = byId.final
    const fillN = flow ? 8 : clamp((X - fin.x) / (fin.w + 40)) * 8
    for (const s of slotEls.current) {
      if (s.kind === 'output') s.el.classList.toggle('ink', s.i < fillN - 0.001)
      else { const n = byId[s.node]; s.el.classList.toggle('ink', flow || X > n.x + 30 + s.i * 7) }
    }
    // status line + progress bar while the run is going, then the result
    const label = flow || rp >= 1 ? 'Done. Finished ads are ready.' : rp <= 0 ? 'Scroll to run the workflow' : `Running · ${now || 'Passing between nodes'}`
    if (label !== lastLabel.current && status.current) { lastLabel.current = label; status.current.textContent = label }
    if (bar.current) bar.current.style.transform = `scaleX(${rp.toFixed(3)})`
    const done = flow ? 1 : sm(0.8, 0.9, p)
    run.current!.style.opacity = String(1 - done); stat.current!.style.opacity = String(done)
    stat.current!.style.transform = `translateY(${(1 - done) * 24}px)`
    stat.current!.style.pointerEvents = done > 0.6 ? 'auto' : 'none'
    if (num.current) num.current.textContent = String(Math.round(40 * (flow ? 1 : easeOut(clamp((p - 0.82) / 0.14))))) + '%'
    void t
  })

  return (
    <Chapter id="plix">
      <div className="plix stage-paper">
        <div className="gridbg fill" aria-hidden />
        <div className="phead">
          <div className="plogocard"><PlixLogo /></div>
          <div>
            <span className="label">{PLIX.index}</span>
            <h2 className="display">{PLIX.role}</h2>
            <p className="mono dim-ink">{PLIX.period} · {PLIX.status}</p>
          </div>
        </div>
        <div className="graphbox">
          <svg ref={svg} viewBox={`0 30 ${VB.w} 560`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Simplified Figma Weave workflow: inputs flow through creative direction and generation into finished ads.">
            <defs>
              <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill={C.ink} /><line x1="0" y1="0" x2="0" y2="9" stroke="#3a2a48" strokeWidth="4" /></pattern>
            </defs>
            <g>
              {edges.map((e) => (
                <g key={e.i}>
                  <path d={e.d} className={'ge base' + (e.dashed ? ' dashed' : '')} />
                  <path id={'pe' + e.i} d={e.d} className={'ge run' + (e.dashed ? ' dashed' : '')} />
                  <circle id={'pk' + e.i} className="packet" r="7" cx="0" cy="0" opacity="0" />
                </g>
              ))}
              {PLIX_NODES.map((n) => (
                <g key={n.id} className={'gn ' + n.kind} data-id={n.id} style={{ ['--f' as string]: FILL[n.kind] }}>
                  <rect className="box" x={n.x} y={n.y} width={n.w} height={n.h} rx={10} fill={n.kind === 'locked' ? 'url(#hatch)' : undefined} />
                  <rect className="boxlit" x={n.x} y={n.y} width={n.w} height={n.h} rx={10} />
                  <text x={n.x + 14} y={n.y + 25} fontSize={14} fontWeight={700}>{n.label}</text>
                  {n.sub && <text x={n.x + 14} y={n.y + 42} fontSize={11} className="sub">{n.sub}</text>}
                  {n.slots && Array.from({ length: n.slots.count }).map((_, i) => {
                    const { cols, rows } = n.slots!, gx = 10, top = 58, pad = 14
                    const cw = (n.w - pad * 2 - gx * (cols - 1)) / cols, ch = Math.min(cw, (n.h - top - pad - gx * (rows - 1)) / rows)
                    return <rect key={i} className="sl" data-n={n.id} data-i={i} x={n.x + pad + (i % cols) * (cw + gx)} y={n.y + top + Math.floor(i / cols) * (ch + gx)} width={cw} height={ch} rx={4} />
                  })}
                  {n.kind === 'locked' && (
                    <g transform={`translate(${n.x + n.w / 2 - 14} ${n.y + 62})`}>
                      <rect x={2} y={13} width={24} height={18} rx={3} fill="none" stroke={C.paper} strokeWidth={2} /><path d="M7 13V8a7 7 0 0 1 14 0v5" fill="none" stroke={C.paper} strokeWidth={2} />
                    </g>
                  )}
                </g>
              ))}
            </g>
            <g ref={head} className="playhead">
              <line x1="0" y1="30" x2="0" y2="590" /><rect x="-26" y="30" width="52" height="22" rx="11" /><text x="0" y="45" textAnchor="middle">RUN</text>
            </g>
          </svg>
        </div>
        <div className="pfoot">
          <div className="prun" ref={run}><span className="mono" ref={status}>Scroll to run the workflow</span><span className="pbar2"><i ref={bar} /></span></div>
          <div className="pstat" ref={stat}>
            <div className="big"><em className="display" ref={num}>0%</em><span className="mono">{PLIX.statTag}</span></div>
            <p className="ptxt">{PLIX.stat}</p>
            <ul className="ppts">{PLIX.points.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>
        <p className="mono dim-ink pcap">{PLIX.caption} <em>Figma Weave</em></p>
      </div>
    </Chapter>
  )
}
