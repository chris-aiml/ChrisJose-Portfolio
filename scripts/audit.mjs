import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
const errs = []; p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) }); p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://127.0.0.1:4173/?static', { waitUntil: 'domcontentloaded' }); await new Promise((r) => setTimeout(r, 2500))
const info = await p.evaluate(() => ({ canvas: document.querySelectorAll('canvas').length, lenis: document.documentElement.classList.contains('lenis'), h: document.documentElement.scrollHeight, text: document.body.innerText + ' ' + [...document.querySelectorAll('.cv-paper')].map((e) => e.textContent).join(' ') }))
const bad = ['patent', 'purifier', 'stripe', 'encore', 'influenceai', 'citylearn', 'adintel', 'agentaudit', 'competition', 'hackathon', 'raul', 'rodriguez', 'passionate', 'delve', 'tapestry', 'visionary', 'bridging the gap', 'noise into signal', 'synergy']
console.log('static canvas', info.canvas, 'lenis', info.lenis, 'height', info.h)
console.log('banned hits', bad.filter((w) => info.text.toLowerCase().includes(w)))
console.log('phone-like', /\+?\d[\d\s-]{9,}\d/.test(info.text.replace(/452276-001/g, '')))
for (const t of ['Management']) { await p.evaluate(() => window.dispatchEvent(new CustomEvent('cj:cv'))); await new Promise(r => setTimeout(r, 600)); await p.evaluate(() => [...document.querySelectorAll('.cv-bar .tabs button')].find(b => b.textContent === 'Management').click()); await new Promise(r => setTimeout(r, 300)); await p.emulateMediaType('print'); await p.pdf({ path: 'shots/cv_mgmt.pdf', format: 'A4', printBackground: true }) }
console.log('errors', errs)
await b.close()
