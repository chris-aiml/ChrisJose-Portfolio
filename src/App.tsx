import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { engine } from './story/engine'
import { Cursor } from './ui/Cursor'
import { Sparkle } from './ui/Sparkle'
import { Chrome } from './ui/Chrome'
import { Resume } from './ui/Resume'
import { Intro } from './scenes/Intro'
import { About } from './scenes/About'
import { Leadership } from './scenes/Leadership'
import { Plix } from './scenes/Plix'
import { Lucen } from './scenes/Lucen'
import { Hardware } from './scenes/Hardware'
import { Capabilities } from './scenes/Capabilities'
import { ResumeScene } from './scenes/Resume'
import { Contact } from './scenes/Contact'

/** `flow` = reduced motion or ?static: no smooth scroll, every scene shown in its finished state, normal document flow. */
export function App({ flow }: { flow: boolean }) {
  useEffect(() => {
    engine.init(flow)
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __cj: unknown }).__cj = { engine, jump: engine.jump.bind(engine) }
    return () => engine.destroy()
  }, [flow])
  return (
    <>
      <Chrome interactive={!flow} />
      <main>
        <Intro /><About /><Leadership /><Plix /><Lucen /><Hardware />
        <Capabilities /><ResumeScene /><Contact />
      </main>
      <Cursor />
      <Sparkle />
      <Resume />
      <Analytics />
    </>
  )
}
