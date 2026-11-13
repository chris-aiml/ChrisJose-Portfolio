import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 })
await p.goto('http://127.0.0.1:4173/?debug', { waitUntil: 'domcontentloaded' }); await new Promise((r) => setTimeout(r, 5000))
await p.mouse.move(700, 450)
const read = () => p.evaluate(() => ({ y: Math.round(scrollY), p: +window.__cj.scrollState.p.toFixed(4), act: window.__cj.scrollState.active }))
console.log('start', await read())
for (let i = 0; i < 6; i++) { await p.mouse.wheel({ deltaY: 400 }); await new Promise((r) => setTimeout(r, 450)) }
console.log('after 6 wheels', await read())
for (let i = 0; i < 40; i++) { await p.mouse.wheel({ deltaY: 400 }); await new Promise((r) => setTimeout(r, 120)) }
await new Promise((r) => setTimeout(r, 2500)); console.log('after 46 wheels', await read())
await b.close()
