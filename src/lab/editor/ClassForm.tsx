import { useEffect, useId, useState, type FormEvent } from 'react'
import type { Attribute, PlayerClass } from '../../api/catalog'
import {
  ContentInvalidError,
  useCreateClass,
  useDeleteClass,
  useEditorCards,
  usePublishClass,
  useSaveClass,
  type ContentStatus,
  type EditorClass,
} from '../../api/editor'
import { ApiError } from '../../api/http'
import { playerClassLabels } from '../../ui/labels'
import { termCatalog } from '../../ui/terms'
import { ListField, SelectField, TextField } from './CardForm'
import {
  attributeOptions,
  options,
  useFieldErrors,
  type FieldErrors,
} from './formHelpers'
import { classOrder, modifierOrder } from './cardFormValues'
import {
  formFromClass,
  sameClassForm,
  toClassInput,
  type ClassForm as ClassFormValues,
} from './classFormValues'
import { ConfirmDialog } from './ConfirmDialog'

const unavailable = 'Servidor indisponível. Tente novamente.'

const classOptions = options(classOrder, playerClassLabels)

/** O que o formulário abre: classe salva (com id) ou nova (`null`). */
export interface OpenedClass {
  playerClass: PlayerClass | null
  status: ContentStatus
  values: ClassFormValues
}

type Confirming = null | 'publish' | 'delete'

/**
 * Formulário de classe (REQ-32), no molde do formulário de carta (D-43, D-46):
 * estado próprio, e `onDirtyChange` leva as alterações à guarda do editor.
 */
export function ClassForm({
  collectionId,
  opened,
  onSaved,
  onDeleted,
  onDirtyChange,
}: {
  collectionId: string
  opened: OpenedClass
  onSaved: (playerClass: PlayerClass) => void
  onDeleted: () => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const [playerClass, setPlayerClass] = useState(opened.playerClass)
  const [status, setStatus] = useState(opened.status)
  const [initial, setInitial] = useState(opened.values)
  const [values, setValues] = useState(opened.values)
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>([])
  const [confirming, setConfirming] = useState<Confirming>(null)
  const create = useCreateClass()
  const save = useSaveClass()
  const publish = usePublishClass()
  const remove = useDeleteClass()
  const busy =
    create.isPending || save.isPending || publish.isPending || remove.isPending
  const errors = useFieldErrors(fieldErrors)
  // sugestões de "Carta {n}": as cartas de atributo da coleção (o backend filtra)
  const attributeCards =
    useEditorCards(collectionId, { type: 'attribute' }).data ?? []
  const cardListId = useId()

  const dirty = !sameClassForm(values, initial)
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  const input = toClassInput(values)

  function show(result: EditorClass, text: string): void {
    const next = formFromClass(result)
    setInitial(next)
    setValues(next)
    setPlayerClass(result.classDefinition.playerClass)
    setStatus(result.status)
    setMessage(text)
    onSaved(result.classDefinition.playerClass)
  }

  function startRequest(): void {
    setMessage('')
    setFieldErrors([])
  }

  function onError(error: Error): void {
    setMessage(error instanceof ApiError ? error.message : unavailable)
    setFieldErrors(error instanceof ContentInvalidError ? error.fields : [])
  }

  function onSubmit(event: FormEvent): void {
    event.preventDefault()
    if (input === null) return
    startRequest()
    const onSuccess = (result: EditorClass) => show(result, 'Classe salva.')
    if (playerClass === null) {
      create.mutate({ collectionId, input }, { onSuccess, onError })
    } else {
      save.mutate({ playerClass, input }, { onSuccess, onError })
    }
  }

  function onConfirm(): void {
    const action = confirming
    setConfirming(null)
    if (playerClass === null || action === null) return
    startRequest()
    if (action === 'publish') {
      publish.mutate(playerClass, {
        onSuccess: (result) => show(result, 'Classe publicada.'),
        onError,
      })
    } else {
      remove.mutate(playerClass, { onSuccess: onDeleted, onError })
    }
  }

  return (
    <section aria-labelledby="editor-class-title">
      <h2 id="editor-class-title">Classe</h2>
      <p role="status">{message}</p>
      <form noValidate onSubmit={onSubmit}>
        <SelectField
          label="Classe"
          path="playerClass"
          value={values.playerClass}
          options={classOptions}
          onChange={(next) => setValues({ ...values, playerClass: next })}
          errors={errors}
          disabled={status === 'published'}
        />
        <TextField
          label="Nome"
          path="name"
          value={values.name}
          onChange={(name) => setValues({ ...values, name })}
          errors={errors}
        />
        <ListField
          label="Atributos essenciais"
          path="essentialAttributes"
          items={values.essentialAttributes}
          onChange={(essentialAttributes) =>
            setValues({ ...values, essentialAttributes })
          }
          newItem={(): Attribute | '' => ''}
          errors={errors}
          renderItem={(item, index, set) => (
            <SelectField
              label={`Atributo essencial ${index + 1}`}
              path={`essentialAttributes.${index}`}
              value={item}
              options={attributeOptions}
              onChange={set}
              errors={errors}
            />
          )}
        />
        <fieldset aria-describedby={errors.describedBy('baseModifiers')}>
          <legend>Modificadores base</legend>
          {errors.errorText('baseModifiers')}
          {modifierOrder.map((modifier) => (
            <TextField
              key={modifier}
              label={termCatalog[modifier].name}
              path={`baseModifiers.${modifier}`}
              value={values.baseModifiers[modifier]}
              onChange={(text) =>
                setValues({
                  ...values,
                  baseModifiers: { ...values.baseModifiers, [modifier]: text },
                })
              }
              errors={errors}
            />
          ))}
        </fieldset>
        <datalist id={cardListId}>
          {attributeCards.map((card) => (
            <option key={card.id} value={card.id} />
          ))}
        </datalist>
        <ListField
          label="Deck pré-pronto"
          path="starterDeck"
          items={values.starterDeck}
          onChange={(starterDeck) => setValues({ ...values, starterDeck })}
          newItem={() => ({ cardId: '', copies: '' })}
          errors={errors}
          renderItem={(item, index, set) => (
            <>
              <TextField
                label={`Carta ${index + 1}`}
                path={`starterDeck.${index}.cardId`}
                value={item.cardId}
                onChange={(cardId) => set({ ...item, cardId })}
                errors={errors}
                list={cardListId}
              />
              <TextField
                label={`Cópias ${index + 1}`}
                path={`starterDeck.${index}.copies`}
                value={item.copies}
                onChange={(copies) => set({ ...item, copies })}
                errors={errors}
              />
            </>
          )}
        />
        <button type="submit" disabled={input === null || busy}>
          Salvar classe
        </button>
        <button
          type="button"
          disabled={playerClass === null || status !== 'draft' || dirty || busy}
          onClick={() => setConfirming('publish')}
        >
          Publicar classe
        </button>
        <button
          type="button"
          disabled={playerClass === null || busy}
          onClick={() => setConfirming('delete')}
        >
          Excluir classe
        </button>
      </form>
      {confirming === 'publish' && (
        <ConfirmDialog
          title={`Publicar “${initial.name}”?`}
          text="Depois de publicada, a classe pode ser escolhida em novos jogos e o identificador não pode mais mudar."
          confirmLabel="Publicar"
          cancelLabel="Cancelar"
          onConfirm={onConfirm}
          onCancel={() => setConfirming(null)}
        />
      )}
      {confirming === 'delete' && (
        <ConfirmDialog
          title={`Excluir “${initial.name}”?`}
          text="A classe será apagada. Não dá para desfazer."
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          onConfirm={onConfirm}
          onCancel={() => setConfirming(null)}
        />
      )}
    </section>
  )
}
