import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--blink-settings=primaryPointerType=4,primaryHoverType=2,availablePointerTypes=4,availableHoverTypes=2'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
const cdp = await p.createCDPSession(); await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'fine' }, { name: 'hover', value: 'hover' }] })
await p.goto('http://127.0.0.1:4173/?debug', { waitUntil: 'domcontentloaded' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); await sleep(6000)
// sweep through the sky: stars should part around the pointer, sparkles trail behind it
for (let i = 0; i <= 40; i++) { await p.mouse.move(300 + i * 18, 560 - Math.sin(i / 5) * 90); await sleep(16) }
await p.screenshot({ path: 'shots/fx_trail.png' })
await p.mouse.down(); await sleep(120); await p.screenshot({ path: 'shots/fx_burst.png' }); await p.mouse.up()
await b.close()
