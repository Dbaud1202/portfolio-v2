import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// fixed 3D keyboard background (Spline scene) — code-split so the heavy
// runtime loads in its own chunk instead of bloating the initial bundle.
import('./spline-bg.js').then((m) => m.initSplineBg())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
