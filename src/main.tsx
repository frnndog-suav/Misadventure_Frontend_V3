import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { queryClient } from './api/queryClient'
import App from './App'
import './ui/tokens.css'
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

/** Rotas só de dev: o laboratório (REQ-05, D-07) fica fora do build de release. */
async function loadDevRoutes(): Promise<ReactNode> {
  if (import.meta.env.DEV) {
    const { labRoute } = await import('./lab/labRoute')
    return labRoute
  }
  return null
}

Promise.all([enableMocks(), loadDevRoutes()]).then(([, devRoutes]) => {
  // Roteador de dados (D-41): permite o `useBlocker` do editor (REQ-24).
  // Uma rota '*' monta o App, que segue com as próprias `<Routes>`.
  const router = createBrowserRouter([
    { path: '*', element: <App devRoutes={devRoutes} /> },
  ])
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
