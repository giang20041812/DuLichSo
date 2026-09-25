import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/index.css'
import '@fontsource/plus-jakarta-sans/index.css'
import './styles/globals.css'
import App from './App.tsx'
import { installAuthInterceptor } from './lib/authInterceptor'
import { installApiBase } from './lib/apiBase'

// Capture beforeinstallprompt immediately at the earliest possible lifecycle
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as unknown as { __deferredPwaPrompt?: Event }).__deferredPwaPrompt = e;
  });
}

installApiBase()
installAuthInterceptor()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
