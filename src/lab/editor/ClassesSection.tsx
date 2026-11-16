import { useState } from 'react'
import type { PlayerClass } from '../../api/catalog'
import {
  useEditorClass,
  useEditorClasses,
  type ContentStatus,
} from '../../api/editor'
import { ApiError } from '../../api/http'
import { ClassForm } from './ClassForm'
import { emptyClassForm, formFromClass } from './classFormValues'

const unavailable = 'Servidor indisponível. Tente novamente.'

const statusLabels = {
  draft: 'Rascunho',
  published: 'Publicada',
} satisfies Record<ContentStatus, string>

function errorText(error: Error): string {
  return error instanceof ApiError ? error.message : unavailable
}

/** Classe escolhida ou classe nova. */
type Selection =
  null | { kind: 'class'; playerClass: PlayerClass } | { kind: 'new' }

interface FormProps {
  collectionId: string
  onSaved: (playerClass: PlayerClass) => void
  onDeleted: () => void
  onDirtyChange: (dirty: boolean) => void
}

/** Carrega a classe escolhida e abre o formulário com os valores recebidos. */
function SavedClassForm({
  playerClass,
  ...props
}: FormProps & { playerClass: PlayerClass }) {
  const { data, error } = useEditorClass(playerClass)
  if (data === undefined) {
    return (
      <section aria-labelledby="editor-class-title">
        <h2 id="editor-class-title">Classe</h2>
        <p role="status">
          {error === null ? 'Carregando classe…' : errorText(error)}
        </p>
      </section>
    )
  }
  return (
    <ClassForm
      {...props}
      opened={{
        playerClass: data.classDefinition.playerClass,
        status: data.status,
        values: formFromClass(data),
      }}
    />
  )
}

/** Seção "Classes" da coleção escolhida (REQ-32). */
export function ClassesSection({
  collectionId,
  guard,
  onDirtyChange,
}: {
  collectionId: string
  guard: (action: () => void) => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const classes = useEditorClasses(collectionId)
  const [selection, setSelection] = useState<Selection>(null)
  /** O que o formulário abriu; salvar muda só a `selection` (como a D-43). */
  const [opened, setOpened] = useState<Selection>(null)
  const [formKey, setFormKey] = useState(0)
  /** "Classe excluída." depois que o formulário fecha. */
  const [notice, setNotice] = useState('')

  function open(next: NonNullable<Selection>): void {
    setSelection(next)
    setOpened(next)
    setFormKey((key) => key + 1)
    setNotice('')
  }

  function closeDeleted(): void {
    setSelection(null)
    setOpened(null)
    setNotice('Classe excluída.')
  }

  let statusText = notice
  if (classes.isPending) statusText = 'Carregando classes…'
  else if (classes.isError) statusText = errorText(classes.error)

  const formProps: FormProps = {
    collectionId,
    onDirtyChange,
    onSaved: (playerClass) => setSelection({ kind: 'class', playerClass }),
    onDeleted: closeDeleted,
  }

  return (
    <>
      <section aria-labelledby="editor-classes-title">
        <h2 id="editor-classes-title">Classes</h2>
        <p role="status">{statusText}</p>
        <button
          type="button"
          onClick={() => guard(() => open({ kind: 'new' }))}
        >
          Nova classe
        </button>
        {classes.isSuccess &&
          (classes.data.length === 0 ? (
            <p>Nenhuma classe nesta coleção.</p>
          ) : (
            <ul aria-label="Classes">
              {classes.data.map((entry) => {
                const pressed =
                  selection?.kind === 'class' &&
                  selection.playerClass === entry.playerClass
                return (
                  <li key={entry.playerClass}>
                    <button
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => {
                        if (pressed) return
                        guard(() =>
                          open({
                            kind: 'class',
                            playerClass: entry.playerClass,
                          }),
                        )
                      }}
                    >
                      {`${entry.name} · ${statusLabels[entry.status]}`}
                    </button>
                  </li>
                )
              })}
            </ul>
          ))}
      </section>
      {opened?.kind === 'class' && (
        <SavedClassForm
          key={formKey}
          {...formProps}
          playerClass={opened.playerClass}
        />
      )}
      {opened?.kind === 'new' && (
        <ClassForm
          key={formKey}
          {...formProps}
          opened={{
            playerClass: null,
            status: 'draft',
            values: emptyClassForm(),
          }}
        />
      )}
    </>
  )
}
