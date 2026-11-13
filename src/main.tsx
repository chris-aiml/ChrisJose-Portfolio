import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/base.css'
import './styles/scenes.css'
import './styles/cv.css'
import { App } from './App'

const q = new URLSearchParams(location.search)
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const flow = q.has('static') || reduced
if (flow) document.documentElement.setAttribute('data-flow', '')
createRoot(document.getElementById('root')!).render(<StrictMode><App flow={flow} /></StrictMode>)
