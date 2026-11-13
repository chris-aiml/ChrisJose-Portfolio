import puppeteer from 'puppeteer-core'
// usage: node scripts/story_shot.mjs URL outPrefix W H id:p id:p ...
const [,, url, out, w, h, ...specs] = process.argv
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] })
const p = await b.newPage()
await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 })
const errs = []
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()) })
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
await p.goto(url + (url.includes('?') ? '&' : '?') + 'debug', { waitUntil: 'domcontentloaded', timeout: 90000 })
await new Promise((r) => setTimeout(r, 3500))
for (const s of specs) {
  const [id, pr] = s.split(':')
  await p.evaluate((i, q) => window.__cj.jump(i, q), id, +pr)
  await new Promise((r) => setTimeout(r, 1600))
  await p.screenshot({ path: `${out}_${id}_${String(pr).replace('.', '')}.png` })
}
console.log(JSON.stringify(errs.slice(0, 15)))
await b.close()
