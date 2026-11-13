import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--blink-settings=primaryPointerType=4,primaryHoverType=2,availablePointerTypes=4,availableHoverTypes=2'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
const errs = []; p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) }); p.on('pageerror', (e) => errs.push(e.message))
const cdp = await p.createCDPSession(); await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'fine' }, { name: 'hover', value: 'hover' }] })
await p.goto('http://127.0.0.1:4173/?debug', { waitUntil: 'domcontentloaded' })
const clip = async (path, c) => { const y = await p.evaluate(() => window.scrollY); await p.screenshot({ path, clip: { ...c, y: c.y + y } }) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); await sleep(6000)
// hero name hover
const nm = await p.$('.hname'); const nb = await nm.boundingBox()
await p.mouse.move(nb.x + 40, nb.y + nb.height / 2); await p.mouse.move(nb.x + 200, nb.y + nb.height / 2, { steps: 8 }); await sleep(250)
await clip('shots/j_name.png', { x: 40, y: 330, width: 700, height: 300 })
// ink cursor over a light tile
await p.evaluate(() => window.__cj.scroll.jumpToProgress(0.3)); await sleep(2500)
const st = await p.$('.stat'); const sb = await st.boundingBox()
await p.mouse.move(sb.x + 60, sb.y + 40, { steps: 6 }); await sleep(500)
console.log('ink class', await p.evaluate(() => document.documentElement.classList.contains('cur-ink')))
await clip('shots/j_ink.png', { x: sb.x - 20, y: sb.y - 20, width: 460, height: 190 })
await p.mouse.move(700, 120); await sleep(300)
console.log('ink after leaving', await p.evaluate(() => document.documentElement.classList.contains('cur-ink')))
// portrait hover + scroll
await p.evaluate(() => window.__cj.scroll.jumpToProgress(0.2)); await sleep(2500)
const fr = await p.$('.frame'); const fb = await fr.boundingBox()
await p.mouse.move(fb.x + fb.width * 0.5, fb.y + fb.height * 0.6, { steps: 4 }); await sleep(900)
await clip('shots/j_port_hover.png', { x: fb.x - 40, y: fb.y - 30, width: fb.width + 80, height: fb.height + 60 })
for (let i = 0; i < 7; i++) { await p.mouse.wheel({ deltaY: 40 }); await sleep(50) }
await sleep(120)
await clip('shots/j_port_scroll.png', { x: fb.x - 40, y: fb.y - 30, width: fb.width + 80, height: fb.height + 60 })
// plix run
await p.evaluate(() => window.__cj.scroll.jumpToProgress(0.5)); await sleep(2500)
await p.click('.ginfo .pill'); await sleep(2200)
await p.screenshot({ path: 'shots/j_plix_mid.png' })
await sleep(4200)
await p.screenshot({ path: 'shots/j_plix_done.png' })
// lucen controls
await p.evaluate(() => window.__cj.scroll.jumpToProgress(0.62)); await sleep(2500)
const chip = await p.$$('.stagebar button'); await chip[1].click(); await sleep(1800)
await p.screenshot({ path: 'shots/j_lucen_stage2.png' })
console.log('errors', JSON.stringify(errs.slice(0, 8)))
await b.close()
