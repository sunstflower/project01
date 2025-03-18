import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Flow from '@/components/canvas.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Flow />
  </StrictMode>,
)
