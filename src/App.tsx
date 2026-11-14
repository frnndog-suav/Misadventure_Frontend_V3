import { Route, Routes } from 'react-router-dom'

function Home() {
  return (
    <main>
      <h1>Misadventures</h1>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
    </Routes>
  )
}
