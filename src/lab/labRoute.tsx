import { Route } from 'react-router-dom'
import LabPage from './LabPage'

/** Rota /lab, montada só pelo ponto de entrada de dev (D-07, D-08). */
export const labRoute = <Route path="lab" element={<LabPage />} />
