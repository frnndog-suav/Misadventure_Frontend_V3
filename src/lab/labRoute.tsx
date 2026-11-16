import { Route } from 'react-router-dom'
import { EditorPage } from './editor/EditorPage'
import LabPage from './LabPage'

/** Rotas /lab e /lab/editor, montadas só pelo ponto de entrada de dev (D-07, D-08). */
export const labRoute = (
  <>
    <Route path="lab" element={<LabPage />} />
    <Route path="lab/editor" element={<EditorPage />} />
  </>
)
