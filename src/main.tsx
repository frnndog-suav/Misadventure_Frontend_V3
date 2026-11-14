import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from './api/queryClient'
import App from './App'
import './index.css'

/**
 * Liga o MSW antes de montar o app (spec D-04, D-10). O guard com
 * `import.meta.env.DEV` tira do build de release o runtime do MSW e o
 * worker (plugin msw/vite); `shouldEnableMocks` decide pelo VITE_USE_MOCKS.
 */
async function enableMocks(): Promise<void> {
  if (import.meta.env.DEV) {
    const { shouldEnableMocks } = await import('./mocks/shouldEnableMocks')
    if (!shouldEnableMocks(import.meta.env)) return
    const { network } = await import('virtual:msw')
    const { handlers } = await import('./mocks/handlers')
    network.configure({ handlers })
    await network.enable()
  }
}

enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
})
