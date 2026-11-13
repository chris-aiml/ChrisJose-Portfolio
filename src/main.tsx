import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { App, StaticApp } from './App'

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}
const staticMode = new URLSearchParams(location.search).has('static') || !webglOK()
if (staticMode) document.documentElement.setAttribute('data-static', '')
createRoot(document.getElementById('root')!).render(<StrictMode>{staticMode ? <StaticApp /> : <App />}</StrictMode>)
