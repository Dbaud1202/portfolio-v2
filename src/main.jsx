import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './gallery.css'
import GalleryApp from './GalleryApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GalleryApp />
  </StrictMode>,
)
