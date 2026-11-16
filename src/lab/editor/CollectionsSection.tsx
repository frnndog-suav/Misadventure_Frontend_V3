import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { CardType, Rarity } from '../../api/catalog'
import {
  ContentInvalidError,
  useCreateCollection,
  useDeleteCollection,
  useEditorCollection,
  useEditorCollections,
  useExportCollection,
  useImportCollection,
  useUpdateCollection,
  useValidateDimension,
  type CollectionInput,
  type EditorCollection,
} from '../../api/editor'
import { ApiError } from '../../api/http'
import { cardTypeLabels, rarityLabels } from '../../ui/labels'
import { CardsSection } from './CardsSection'
import { ConfirmDialog } from './ConfirmDialog'
import { downloadJson } from './downloadJson'
import { useUnsavedGuard } from './useUnsavedGuard'

const unavailable = 'Servidor indisponível. Tente novamente.'

/** Erro → texto da área de status (D-01): `message` do §1.4 ou genérico. */
function errorText(error: Error): string {
  return error instanceof ApiError ? error.message : unavailable
}

type FieldKey = keyof CollectionInput

const fieldLabels: Record<FieldKey, string> = {
  id: 'Identificador',
  name: 'Nome',
  description: 'Descrição',
}

const fieldKeys = Object.keys(fieldLabels) as FieldKey[]

const emptyValues: CollectionInput = { id: '', name: '', description: '' }

/** `null`: sem formulário; `new`: criar; `edit`: editar a coleção escolhida. */
type FormMode = null | 'new' | 'edit'

function CollectionPanel({
  collection,
  onEdit,
  onDelete,
  onValidate,
  onExport,
}: {
  collection: EditorCollection
  onEdit: () => void
  onDelete: () => void
  onValidate: () => void
  onExport: () => void
}) {
  return (
    <div>
      <h3>{collection.name}</h3>
      {collection.description && <p>{collection.description}</p>}
      <ul aria-label="Por tipo">
        {(Object.keys(cardTypeLabels) as CardType[]).map((type) => (
          <li key={type}>
            {cardTypeLabels[type]}: {collection.cardCounts[type]}
          </li>
        ))}
      </ul>
      <ul aria-label="Por raridade">
        {(Object.keys(rarityLabels) as Rarity[]).map((rarity) => (
          <li key={rarity}>
            {rarityLabels[rarity]}: {collection.rarityCounts[rarity]}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onEdit}>
        Editar coleção
      </button>
      <button type="button" onClick={onDelete}>
        Excluir coleção
      </button>
      <button type="button" onClick={onValidate}>
        Validar como dimensão
      </button>
      <button type="button" onClick={onExport}>
        Exportar
      </button>
    </div>
  )
}

/** Seção "Coleções" do editor (REQ-19, REQ-25, REQ-26; REQ-24 na parte de coleção). */
export function CollectionsSection() {
  const collections = useEditorCollections()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = useEditorCollection(selectedId)
  const create = useCreateCollection()
  const update = useUpdateCollection()
  const remove = useDeleteCollection()
  const validate = useValidateDimension()
  const exportCollection = useExportCollection()
  const importCollection = useImportCollection()

  const [problems, setProblems] = useState<string[]>([])
  const [replace, setReplace] = useState(false)

  const [mode, setMode] = useState<FormMode>(null)
  const [initial, setInitial] = useState<CollectionInput>(emptyValues)
  const [values, setValues] = useState<CollectionInput>(emptyValues)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [message, setMessage] = useState('')

  const [cardDirty, setCardDirty] = useState(false)

  const collectionDirty =
    mode !== null && fieldKeys.some((key) => values[key] !== initial[key])
  // Uma guarda só para coleção e carta: o roteador aceita um bloqueio (D-43).
  const { guard, dialog } = useUnsavedGuard(
    collectionDirty || cardDirty,
    collectionDirty ? 'desta coleção' : 'desta carta',
  )

  const submit = mode === 'edit' ? update : create
  const fieldErrors =
    submit.error instanceof ContentInvalidError ? submit.error.fields : []

  function openForm(next: FormMode, start: CollectionInput): void {
    create.reset()
    update.reset()
    setMessage('')
    setMode(next)
    setInitial(start)
    setValues(start)
  }

  function choose(id: string): void {
    if (id === selectedId) return
    guard(() => {
      setSelectedId(id)
      setMode(null)
      setMessage('')
      setProblems([])
    })
  }

  function validateSelected(): void {
    if (selectedId === null) return
    setMessage('')
    setProblems([])
    validate.mutate(selectedId, {
      onSuccess: (result) => {
        if (result.valid) {
          setMessage('A coleção forma uma dimensão válida.')
        } else {
          setMessage('A coleção não forma uma dimensão válida.')
          setProblems(result.problems)
        }
      },
      onError: (error) => setMessage(errorText(error)),
    })
  }

  function exportSelected(): void {
    if (selectedId === null) return
    const id = selectedId
    setMessage('')
    setProblems([])
    exportCollection.mutate(id, {
      onSuccess: (data) => {
        downloadJson(`${id}.json`, data)
        setMessage('Coleção exportada.')
      },
      onError: (error) => setMessage(errorText(error)),
    })
  }

  /** Lê o arquivo e envia o conteúdo como está; o backend valida (REQ-26). */
  async function importFile(file: File): Promise<void> {
    setMessage('')
    setProblems([])
    let content: unknown
    try {
      content = JSON.parse(await file.text())
    } catch {
      setMessage('O arquivo não é um JSON válido.')
      return
    }
    importCollection.mutate(
      { content, replace },
      {
        onSuccess: (result) => {
          setSelectedId(result.collectionId)
          setMode(null)
          setMessage(`Coleção importada: ${result.cardCount} cartas.`)
        },
        onError: (error) => {
          setMessage(errorText(error))
          if (
            error instanceof ContentInvalidError &&
            error.code === 'CONTENT_INVALID'
          ) {
            setProblems(
              error.fields.map((f) =>
                f.path === '' ? f.message : `${f.path}: ${f.message}`,
              ),
            )
          }
        },
      },
    )
  }

  function onFileChosen(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    // Limpa o campo para poder escolher o mesmo arquivo de novo.
    event.target.value = ''
    if (file) guard(() => void importFile(file))
  }

  function onSubmit(event: FormEvent): void {
    event.preventDefault()
    setMessage('')
    if (mode === 'new') {
      create.mutate(values, {
        onSuccess: (collection) => {
          setSelectedId(collection.id)
          setMode(null)
          setMessage('Coleção criada.')
        },
        onError: (error) => setMessage(errorText(error)),
      })
    } else if (mode === 'edit') {
      update.mutate(
        {
          collectionId: values.id,
          patch: { name: values.name, description: values.description },
        },
        {
          onSuccess: () => {
            setMode(null)
            setMessage('Coleção salva.')
          },
          onError: (error) => setMessage(errorText(error)),
        },
      )
    }
  }

  function confirmDelete(): void {
    if (selectedId === null) return
    const id = selectedId
    setConfirmingDelete(false)
    setMessage('')
    remove.mutate(id, {
      onSuccess: () => {
        setSelectedId(null)
        setMode(null)
        setMessage('Coleção excluída.')
      },
      onError: (error) => setMessage(errorText(error)),
    })
  }

  let status = message
  if (!status) {
    if (validate.isPending) status = 'Validando…'
    else if (collections.isPending) status = 'Carregando coleções…'
    else if (collections.isError) status = errorText(collections.error)
    else if (selected.isError) status = errorText(selected.error)
  }

  return (
    <>
      <section aria-labelledby="editor-collections-title">
        <h2 id="editor-collections-title">Coleções</h2>
        <p role="status">{status}</p>
        <button
          type="button"
          onClick={() => guard(() => openForm('new', emptyValues))}
        >
          Nova coleção
        </button>
        <label>
          Importar coleção
          <input
            type="file"
            accept=".json,application/json"
            onChange={onFileChosen}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={replace}
            onChange={(event) => setReplace(event.target.checked)}
          />
          Substituir se já existir
        </label>
        {problems.length > 0 && (
          <div>
            <h3 id="editor-problems-title">Problemas</h3>
            <ul aria-labelledby="editor-problems-title">
              {problems.map((problem, index) => (
                <li key={index}>{problem}</li>
              ))}
            </ul>
          </div>
        )}
        {collections.isSuccess &&
          (collections.data.length === 0 ? (
            <p>Nenhuma coleção ainda.</p>
          ) : (
            <ul aria-label="Coleções">
              {collections.data.map((collection) => (
                <li key={collection.id}>
                  <button
                    type="button"
                    aria-pressed={collection.id === selectedId}
                    onClick={() => choose(collection.id)}
                  >
                    <strong>{collection.name}</strong>{' '}
                    <code>{collection.id}</code>{' '}
                    <span>
                      {collection.publishedCount} publicadas ·{' '}
                      {collection.draftCount} rascunhos
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ))}
        {selected.isSuccess && selectedId !== null && (
          <CollectionPanel
            collection={selected.data}
            onEdit={() =>
              guard(() =>
                openForm('edit', {
                  id: selected.data.id,
                  name: selected.data.name,
                  description: selected.data.description,
                }),
              )
            }
            onDelete={() =>
              guard(() => {
                setMode(null)
                setMessage('')
                setConfirmingDelete(true)
              })
            }
            onValidate={validateSelected}
            onExport={exportSelected}
          />
        )}
        {mode !== null && (
          <form
            noValidate
            aria-label={mode === 'new' ? 'Nova coleção' : 'Editar coleção'}
            onSubmit={onSubmit}
          >
            {fieldKeys.map((key) => {
              const errors = fieldErrors.filter((f) => f.path === key)
              const inputId = `collection-${key}`
              const errorId = `${inputId}-error`
              const props = {
                id: inputId,
                value: values[key],
                readOnly: key === 'id' && mode === 'edit',
                'aria-describedby': errors.length > 0 ? errorId : undefined,
                onChange: (event: { target: { value: string } }) =>
                  setValues({ ...values, [key]: event.target.value }),
              }
              return (
                <div key={key}>
                  <label htmlFor={inputId}>{fieldLabels[key]}</label>
                  {key === 'description' ? (
                    <textarea {...props} />
                  ) : (
                    <input type="text" {...props} />
                  )}
                  {errors.length > 0 && (
                    <p id={errorId}>{errors.map((f) => f.message).join(' ')}</p>
                  )}
                </div>
              )
            })}
            <button type="submit" disabled={submit.isPending}>
              {mode === 'new' ? 'Criar coleção' : 'Salvar coleção'}
            </button>
            <button type="button" onClick={() => setMode(null)}>
              Cancelar
            </button>
          </form>
        )}
        {confirmingDelete && selected.isSuccess && (
          <ConfirmDialog
            title={`Excluir “${selected.data.name}”?`}
            text="A coleção e todas as cartas dela serão apagadas. Não dá para desfazer."
            confirmLabel="Excluir"
            cancelLabel="Cancelar"
            onConfirm={confirmDelete}
            onCancel={() => setConfirmingDelete(false)}
          />
        )}
        {dialog}
      </section>
      {selectedId !== null && selected.isSuccess && (
        <CardsSection
          key={selectedId}
          collectionId={selectedId}
          guard={guard}
          onDirtyChange={setCardDirty}
        />
      )}
    </>
  )
}
