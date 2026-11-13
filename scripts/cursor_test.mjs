import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--blink-settings=primaryPointerType=4,primaryHoverType=2,availablePointerTypes=4,availableHoverTypes=2'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
const errs = []; p.on('console', (m) => { if (['error'].includes(m.type())) errs.push(m.text()) }); p.on('pageerror', (e) => errs.push(e.message))
const cdp = await p.createCDPSession(); await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'fine' }, { name: 'hover', value: 'hover' }] })
await p.goto('http://127.0.0.1:4173/?debug', { waitUntil: 'domcontentloaded' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); await sleep(6000)
const dotCentre = () => p.evaluate(() => { const r = document.querySelector('.cur .core').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
const results = []
async function probe(label, sel, prog) {
  if (prog !== undefined) { await p.evaluate((pr) => window.__cj.scroll.jumpToProgress(pr), prog); await sleep(2600) }
  const el = await p.$(sel); if (!el) { results.push({ label, err: 'selector not found' }); return }
  await el.evaluate((n) => n.scrollIntoView({ block: 'nearest' }))
  const bb = await el.boundingBox()
  const pts = [[0.5, 0.5], [0.25, 0.4], [0.8, 0.6]]
  let worst = 0, hot = null
  for (const [fx, fy] of pts) {
    const x = bb.x + bb.width * fx, y = bb.y + bb.height * fy
    await p.mouse.move(x - 60, y - 40); await p.mouse.move(x, y, { steps: 10 }); await sleep(450)
    const c = await dotCentre(); const d = Math.hypot(c.x - x, c.y - y); worst = Math.max(worst, d)
    hot = await p.evaluate(() => document.querySelector('.cur').classList.contains('hot'))
    // also during motion: move down the page quickly and compare at the end of each step
    for (let i = 1; i <= 6; i++) { const yy = y + i * 6; await p.mouse.move(x, yy); const cc = await dotCentre(); worst = Math.max(worst, Math.hypot(cc.x - x, cc.y - yy)) }
  }
  results.push({ label, worstOffsetPx: +worst.toFixed(2), ringShown: hot })
}
await probe('name', '.hname', 0)
await probe('Run workflow button', '.ginfo .pill', 0.5)
await probe('graph node', '.gn', 0.5)
await probe('Lucen tab', '.ltab-row button:nth-child(2)', 0.64)
await probe('Design certificate link', '.certlink', 0.76)
await probe('Exploded view button', '.hwrow .pill', 0.76)
console.log(JSON.stringify(results, null, 1))
// exploded toggle behaviour
const val = () => p.evaluate(() => +window.__cj.S.manual.value.toFixed(3))
await p.evaluate(() => window.__cj.scroll.jumpToProgress(0.71)); await sleep(2500)
const out = { start: await val() }
await p.click('.hwrow .pill'); await sleep(1800); out.afterExplode = await val(); out.label1 = await p.$eval('.hwrow .pill', (n) => n.textContent)
await p.evaluate(() => window.__cj.scroll.jumpToProgress(0.745)); await sleep(2200); out.scrolledWhileExploded = await val()
await p.click('.hwrow .pill'); await sleep(1800); out.afterAssemble = await val(); out.label2 = await p.$eval('.hwrow .pill', (n) => n.textContent)
await p.evaluate(() => window.__cj.scroll.jumpToProgress(0.8)); await sleep(2500); out.assembledThenScrolledPast = await val()
await p.click('.hwrow .pill'); await sleep(1800); out.afterExplode2 = await val()
await p.click('.hwrow .pill'); await sleep(1800); out.afterAssemble2 = await val()
await p.evaluate(() => window.__cj.scroll.jumpToProgress(0.92)); await sleep(2500); out.leftChapter = await val()
console.log(JSON.stringify(out))
console.log('errors', JSON.stringify(errs.slice(0, 6)))
await b.close()
