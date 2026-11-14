import type { ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useHealth } from './api/health'
import { ApiError } from './api/http'

/** Área de status da ponte com o servidor (REQ-01). */
function HealthStatus() {
  const health = useHealth()

  let statusText: string
  if (health.isPending) {
    statusText = 'Conectando ao servidor…'
  } else if (health.isSuccess) {
    statusText = `Servidor conectado · contrato v${health.data.contractVersion}`
  } else if (health.error instanceof ApiError) {
    statusText = health.error.message
  } else {
    statusText = 'Servidor indisponível. Tente novamente.'
  }

  return <p role="status">{statusText}</p>
}

function Home() {
  return (
    <main>
      <h1>Misadventures</h1>
      <HealthStatus />
    </main>
  )
}

/**
 * `devRoutes`: rotas só de dev (laboratório), entregues por `src/main.tsx`
 * atrás de `import.meta.env.DEV` — o App não importa `src/lab/` (D-07, D-08).
 */
export default function App({ devRoutes }: { devRoutes?: ReactNode }) {
  return (
    <Routes>
      <Route index element={<Home />} />
      {devRoutes}
    </Routes>
  )
}
