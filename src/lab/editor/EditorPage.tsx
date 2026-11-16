import { Link } from 'react-router-dom'
import { CollectionsSection } from './CollectionsSection'

/** Editor de conteúdo em /lab/editor, só no dev (REQ-18, D-39). */
export function EditorPage() {
  return (
    <main>
      <h1>Editor de conteúdo</h1>
      <nav aria-label="Editor">
        <Link to="/lab">Voltar ao laboratório</Link>
      </nav>
      <CollectionsSection />
    </main>
  )
}
