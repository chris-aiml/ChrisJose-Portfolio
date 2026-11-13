import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--blink-settings=primaryPointerType=4,primaryHoverType=2,availablePointerTypes=4,availableHoverTypes=2'] })
const p = await b.newPage()
await p.setViewport({ width: 1440, height: 900 })
const errs = []
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()) })
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
const cdp = await p.createCDPSession(); await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'fine' }, { name: 'hover', value: 'hover' }] })
await p.goto('http://127.0.0.1:4173/?debug', { waitUntil: 'domcontentloaded' })
await new Promise((r) => setTimeout(r, 6000))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// cursor: computed style + presence
const cur = await p.evaluate(() => ({ body: getComputedStyle(document.body).cursor, a: getComputedStyle(document.querySelector('button')).cursor, dots: document.querySelectorAll('.cur-dot').length, rings: document.querySelectorAll('.cur-ring').length, boxes: document.querySelectorAll('.cur-box').length, pf: matchMedia('(pointer: fine)').matches }))
console.log('cursor', JSON.stringify(cur))
// Plix node hover
await p.evaluate(() => window.__cj.scroll.jumpToProgress(0.51)); await sleep(2500)
const node = await p.$$('.gn')
const bb = await node[6].boundingBox() // generate
await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(900)
await p.screenshot({ path: 'shots/i_plix_hover.png' })
console.log('ring', await p.evaluate(() => document.querySelector('.cur-ring').className + ' | box ' + document.querySelector('.cur-box').className + ' | tag ' + document.querySelector('.cur-tag').textContent))
// hover Lucen link
await p.evaluate(() => window.__cj.scroll.jumpToProgress(0.64)); await sleep(2500)
const a = await p.$('a.btn[href]'); const ab = await a.boundingBox()
await p.mouse.move(ab.x + 30, ab.y + ab.height / 2); await sleep(900)
await p.screenshot({ path: 'shots/i_lucen_hover.png' })
console.log('ring2', await p.evaluate(() => document.querySelector('.cur-ring').className + ' | box ' + document.querySelector('.cur-box').className + ' | tag ' + document.querySelector('.cur-tag').textContent), 'href', await a.evaluate((e) => e.getAttribute('href')))
// CV overlay
await p.mouse.move(700, 400); await sleep(100); await p.mouse.move(760, 430, { steps: 6 }); await p.mouse.down(); await sleep(120); await p.screenshot({ path: 'shots/i_ripple.png', clip: { x: 560, y: 300, width: 400, height: 260 } }); await p.mouse.up()
await p.click('button.pill.lime'); await sleep(1200)
await p.screenshot({ path: 'shots/i_cv.png' })
await p.emulateMediaType('print'); await sleep(300)
await p.pdf({ path: 'shots/cv_print.pdf', format: 'A4', printBackground: true })
console.log('errors', JSON.stringify(errs.slice(0, 10)))
await b.close()
