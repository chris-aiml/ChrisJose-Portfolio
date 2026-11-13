import puppeteer from 'puppeteer-core'
const [,, url, out, w, h, ...jumps] = process.argv
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] })
const p = await b.newPage()
await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 })
const errs = []
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()) })
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
await new Promise((r) => setTimeout(r, 8000))
for (const j of jumps.length ? jumps : ['0']) {
  await p.evaluate((pr) => { const c = window.__cj; if (c) { c.scroll.jumpToProgress(pr); } else window.scrollTo(0, pr * document.documentElement.scrollHeight) }, +j)
  await new Promise((r) => setTimeout(r, 2500))
  await p.screenshot({ path: `${out}_${String(j).replace('.', '')}.png` })
}
console.log(JSON.stringify(errs.slice(0, 15)))
await b.close()
