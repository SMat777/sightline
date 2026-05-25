import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ToolView from './features/tool/ToolView.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToolView />
  </StrictMode>,
)
