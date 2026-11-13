import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
const errs = []; p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) }); p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://127.0.0.1:4173/?static', { waitUntil: 'domcontentloaded' }); await new Promise((r) => setTimeout(r, 2500))
const info = await p.evaluate(() => ({ canvas: document.querySelectorAll('canvas').length, lenis: document.documentElement.classList.contains('lenis'), h: document.documentElement.scrollHeight, text: document.body.innerText + ' ' + [...document.querySelectorAll('.cv-paper')].map((e) => e.textContent).join(' ') }))
const bad = ['hardware', 'registrant', 'industrial design', 'purifier', 'stripe', 'encore', 'influenceai', 'citylearn', 'adintel', 'competition', 'hackathon', 'raul', 'rodriguez', 'passionate', 'delve', 'tapestry', 'visionary', 'bridging the gap', 'noise into signal', 'synergy']
console.log('static canvas', info.canvas, 'lenis', info.lenis, 'height', info.h)
console.log('banned hits', bad.filter((w) => info.text.toLowerCase().includes(w)))
const must = ['Leader,', 'Builder', 'The short version', '(literally)', 'Infinity team', 'Caught (simulated)', 'Not validated on real sleepers and not a medical device.', 'Simplified from the production workflow.', 'CJ-1307', 'REV. 13.07', 'Expected 2027', 'In Progress', 'As of Sept 2026', 'Apr – Jun 2026', 'Senior Vice President - Student Council', 'Design certificate', 'Design Patent: Air Quality Monitoring IoT Device']
console.log('missing mandatory', must.filter((w) => !info.text.toLowerCase().includes(w.toLowerCase())))
const gone = ['Distortion', '200-member', 'Turns ambiguous goals', 'Resolved competing priorities in real time and built', '13:07', 'Mumbai-based', 'based in Mumbai', 'piano', 'ABRSM', 'Not the registered drawings', 'Outer shell and handle']
console.log('should be gone but present', gone.filter((w) => info.text.includes(w)))
const intro = await p.evaluate(() => document.getElementById('ch-intro').innerText)
console.log('Mumbai in intro', /mumbai/i.test(intro))
console.log('phone-like', /\+?\d[\d\s-]{9,}\d/.test(info.text.replace(/452276-001/g, '')))
for (const t of ['Management']) { await p.evaluate(() => window.dispatchEvent(new CustomEvent('cj:cv'))); await new Promise(r => setTimeout(r, 600)); await p.evaluate(() => [...document.querySelectorAll('.cv-bar .tabs button')].find(b => b.textContent === 'Management').click()); await new Promise(r => setTimeout(r, 300)); await p.emulateMediaType('print'); await p.pdf({ path: '/tmp/cv_mgmt.pdf', format: 'A4', printBackground: true }) }
console.log('errors', errs)
await b.close()
