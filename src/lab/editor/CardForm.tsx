import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  attributeSchema,
  cardSchema,
  raritySchema,
  zoneTypeSchema,
  type Attribute,
  type AttributeCard,
} from '../../api/catalog'
import {
  ContentInvalidError,
  useCreateCard,
  useSaveCard,
  type ContentInvalidDetails,
  type ContentStatus,
  type EditorCard,
} from '../../api/editor'
import { ApiError } from '../../api/http'
import { FullCard } from '../../ui/cards/FullCard'
import {
  attributeKindLabels,
  rarityLabels,
  zoneActionLabels,
  zoneTypeLabels,
} from '../../ui/labels'
import { termCatalog } from '../../ui/terms'
import {
  formFromCard,
  inputToCard,
  sameForm,
  toInput,
  zoneActionOrder,
  type AttributeForm,
  type CardForm as CardFormValues,
  type ZoneForm,
} from './cardFormValues'

const unavailable = 'Servidor indisponível. Tente novamente.'

const statusLabels = {
  draft: 'Rascunho',
  published: 'Publicada',
} satisfies Record<ContentStatus, string>

const polarityLabels = { positive: 'Positivo', negative: 'Negativo' } as const

type FieldErrors = ContentInvalidDetails['fields']

/**
 * Liga os textos de erro de `details.fields` ao campo do mesmo caminho
 * (D-38): `describedBy(path)` vai no campo, `errorText(path)` logo abaixo.
 */
function useFieldErrors(fields: FieldErrors) {
  const base = useId()
  const idOf = (path: string) => `${base}-${path.replaceAll('.', '-')}-error`
  const messages = (path: string) =>
    fields.filter((f) => f.path === path).map((f) => f.message)
  return {
    describedBy: (path: string) =>
      messages(path).length > 0 ? idOf(path) : undefined,
    errorText: (path: string): ReactNode => {
      const list = messages(path)
      return list.length > 0 ? <p id={idOf(path)}>{list.join(' ')}</p> : null
    },
  }
}

type Errors = ReturnType<typeof useFieldErrors>

function TextField({
  label,
  path,
  value,
  onChange,
  errors,
  multiline = false,
  readOnly = false,
}: {
  label: string
  path: string
  value: string
  onChange: (value: string) => void
  errors: Errors
  multiline?: boolean
  readOnly?: boolean
}) {
  const id = useId()
  const props = {
    id,
    value,
    readOnly,
    'aria-describedby': errors.describedBy(path),
    onChange: (event: { target: { value: string } }) =>
      onChange(event.target.value),
  }
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea {...props} /> : <input type="text" {...props} />}
      {errors.errorText(path)}
    </div>
  )
}

function SelectField<T extends string>({
  label,
  path,
  value,
  options,
  onChange,
  errors,
}: {
  label: string
  path: string
  value: T | ''
  options: readonly { value: T; label: string }[]
  onChange: (value: T | '') => void
  errors: Errors
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        aria-describedby={errors.describedBy(path)}
        onChange={(event) => {
          const next = options.find((o) => o.value === event.target.value)
          onChange(next ? next.value : '')
        }}
      >
        <option value="">Escolha…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errors.errorText(path)}
    </div>
  )
}

/** Lista com "Adicionar", "Remover", "Subir" e "Descer" (REQ-21). */
function ListField<T>({
  label,
  path,
  items,
  onChange,
  newItem,
  renderItem,
  errors,
}: {
  label: string
  path: string
  items: readonly T[]
  onChange: (items: T[]) => void
  newItem: () => T
  renderItem: (item: T, index: number, set: (item: T) => void) => ReactNode
  errors: Errors
}) {
  function move(from: number, to: number): void {
    const next = [...items]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  return (
    <fieldset aria-describedby={errors.describedBy(path)}>
      <legend>{label}</legend>
      {errors.errorText(path)}
      {items.length > 0 && (
        <ol>
          {items.map((item, index) => (
            <li key={index}>
              {renderItem(item, index, (value) =>
                onChange(items.map((old, i) => (i === index ? value : old))),
              )}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                Remover
              </button>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                Subir
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                onClick={() => move(index, index + 1)}
              >
                Descer
              </button>
            </li>
          ))}
        </ol>
      )}
      <button type="button" onClick={() => onChange([...items, newItem()])}>
        Adicionar
      </button>
    </fieldset>
  )
}

function options<T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): { value: T; label: string }[] {
  return values.map((value) => ({ value, label: labels[value] }))
}

const polarityOptions = options(
  Object.keys(polarityLabels) as (keyof typeof polarityLabels)[],
  polarityLabels,
)
const rarityOptions = options(raritySchema.options, rarityLabels)
const zoneTypeOptions = options(zoneTypeSchema.options, zoneTypeLabels)
const attributeKindOptions = options(
  Object.keys(attributeKindLabels) as AttributeCard['attributeKind'][],
  attributeKindLabels,
)
const attributeOptions = options(
  attributeSchema.options,
  Object.fromEntries(
    attributeSchema.options.map((a) => [a, termCatalog[a].name]),
  ) as Record<Attribute, string>,
)

function ZoneFields({
  values,
  set,
  errors,
}: {
  values: ZoneForm
  set: (values: ZoneForm) => void
  errors: Errors
}) {
  return (
    <>
      <TextField
        label="Título"
        path="title"
        value={values.title}
        onChange={(title) => set({ ...values, title })}
        errors={errors}
      />
      <SelectField
        label="Tipo de zona"
        path="zoneType"
        value={values.zoneType}
        options={zoneTypeOptions}
        onChange={(zoneType) => set({ ...values, zoneType })}
        errors={errors}
      />
      <TextField
        label="Local"
        path="location"
        value={values.location}
        onChange={(location) => set({ ...values, location })}
        errors={errors}
      />
      <TextField
        label="Setas de conexão"
        path="connectionArrows"
        value={values.connectionArrows}
        onChange={(connectionArrows) => set({ ...values, connectionArrows })}
        errors={errors}
      />
      <fieldset aria-describedby={errors.describedBy('zoneActions')}>
        <legend>Ações de zona</legend>
        {errors.errorText('zoneActions')}
        {zoneActionOrder.map((action) => (
          <label key={action}>
            <input
              type="checkbox"
              checked={values.zoneActions.includes(action)}
              onChange={(event) =>
                set({
                  ...values,
                  zoneActions: zoneActionOrder.filter((a) =>
                    a === action
                      ? event.target.checked
                      : values.zoneActions.includes(a),
                  ),
                })
              }
            />
            {zoneActionLabels[action]}
          </label>
        ))}
      </fieldset>
      <ListField
        label="Efeitos"
        path="effects"
        items={values.effects}
        onChange={(effects) => set({ ...values, effects })}
        newItem={() => ({ text: '', polarity: 'positive' as const })}
        errors={errors}
        renderItem={(effect, index, setEffect) => (
          <>
            <TextField
              label={`Efeito ${index + 1}`}
              path={`effects.${index}.text`}
              value={effect.text}
              onChange={(text) => setEffect({ ...effect, text })}
              errors={errors}
            />
            <SelectField
              label={`Polaridade do efeito ${index + 1}`}
              path={`effects.${index}.polarity`}
              value={effect.polarity}
              options={polarityOptions}
              onChange={(polarity) =>
                setEffect({ ...effect, polarity: polarity || effect.polarity })
              }
              errors={errors}
            />
          </>
        )}
      />
    </>
  )
}

function AttributeFields({
  values,
  set,
  errors,
}: {
  values: AttributeForm
  set: (values: AttributeForm) => void
  errors: Errors
}) {
  return (
    <>
      <TextField
        label="Nome"
        path="name"
        value={values.name}
        onChange={(name) => set({ ...values, name })}
        errors={errors}
      />
      <TextField
        label="Texto de ambientação"
        path="flavorText"
        value={values.flavorText}
        onChange={(flavorText) => set({ ...values, flavorText })}
        errors={errors}
        multiline
      />
      <SelectField
        label="Raridade"
        path="rarity"
        value={values.rarity}
        options={rarityOptions}
        onChange={(rarity) => set({ ...values, rarity })}
        errors={errors}
      />
      <SelectField
        label="Tipo"
        path="attributeKind"
        value={values.attributeKind}
        options={attributeKindOptions}
        onChange={(attributeKind) => set({ ...values, attributeKind })}
        errors={errors}
      />
      <ListField
        label="Atributos"
        path="attributes"
        items={values.attributes}
        onChange={(attributes) => set({ ...values, attributes })}
        newItem={(): Attribute | '' => ''}
        errors={errors}
        renderItem={(attribute, index, setAttribute) => (
          <SelectField
            label={`Atributo ${index + 1}`}
            path={`attributes.${index}`}
            value={attribute}
            options={attributeOptions}
            onChange={setAttribute}
            errors={errors}
          />
        )}
      />
      <ListField
        label="Efeitos"
        path="effects"
        items={values.effects}
        onChange={(effects) => set({ ...values, effects })}
        newItem={() => ''}
        errors={errors}
        renderItem={(text, index, setText) => (
          <TextField
            label={`Efeito ${index + 1}`}
            path={`effects.${index}.text`}
            value={text}
            onChange={setText}
            errors={errors}
          />
        )}
      />
    </>
  )
}

/** Campos do tipo da carta (REQ-21). */
function TypeFields({
  values,
  set,
  errors,
}: {
  values: CardFormValues
  set: (values: CardFormValues) => void
  errors: Errors
}) {
  switch (values.type) {
    case 'zone':
      return <ZoneFields values={values} set={set} errors={errors} />
    case 'attribute':
      return <AttributeFields values={values} set={set} errors={errors} />
    default: {
      const _exhaustive: never = values
      return _exhaustive
    }
  }
}

/** Carta aberta no formulário: salva (`cardId`) ou nova (`null`). */
export interface OpenedCard {
  cardId: string | null
  status: ContentStatus
  values: CardFormValues
}

/**
 * Formulário de carta (REQ-21) com a pré-visualização (REQ-22). O estado é
 * próprio: depois de salvar, mostra a carta devolvida sem recarregar.
 * `onDirtyChange` leva as alterações não salvas à guarda do editor (REQ-24,
 * D-43).
 */
export function CardForm({
  collectionId,
  opened,
  onSaved,
  onDirtyChange,
}: {
  collectionId: string
  opened: OpenedCard
  onSaved: (cardId: string) => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const [cardId, setCardId] = useState(opened.cardId)
  const [status, setStatus] = useState(opened.status)
  const [initial, setInitial] = useState(opened.values)
  const [values, setValues] = useState(opened.values)
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>([])
  const create = useCreateCard()
  const save = useSaveCard()
  const errors = useFieldErrors(fieldErrors)

  const dirty = !sameForm(values, initial)
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  const input = toInput(values)
  const previewCard =
    input === null
      ? undefined
      : cardSchema.safeParse(inputToCard(input, collectionId)).data

  function onSuccess(result: EditorCard): void {
    const next = formFromCard(result.card)
    if (next !== null) {
      setInitial(next)
      setValues(next)
    }
    setCardId(result.card.id)
    setStatus(result.status)
    setMessage(
      result.status === 'published' ? 'Carta salva.' : 'Rascunho salvo.',
    )
    onSaved(result.card.id)
  }

  function onError(error: Error): void {
    setMessage(error instanceof ApiError ? error.message : unavailable)
    setFieldErrors(error instanceof ContentInvalidError ? error.fields : [])
  }

  function onSubmit(event: FormEvent): void {
    event.preventDefault()
    if (input === null) return
    setMessage('')
    setFieldErrors([])
    if (cardId === null) {
      create.mutate({ collectionId, input }, { onSuccess, onError })
    } else {
      save.mutate({ cardId, input }, { onSuccess, onError })
    }
  }

  return (
    <div>
      <section aria-labelledby="editor-card-title">
        <h2 id="editor-card-title">Carta</h2>
        <p role="status">{message}</p>
        <form noValidate onSubmit={onSubmit}>
          <TextField
            label="Identificador"
            path="slug"
            value={values.slug}
            onChange={(slug) => setValues({ ...values, slug })}
            errors={errors}
            readOnly={status === 'published'}
          />
          <p>{`Id: ${collectionId}.${values.slug}`}</p>
          <p>{`Situação: ${statusLabels[status]}`}</p>
          <TypeFields values={values} set={setValues} errors={errors} />
          <button
            type="submit"
            disabled={input === null || create.isPending || save.isPending}
          >
            Salvar rascunho
          </button>
        </form>
      </section>
      <section aria-labelledby="editor-preview-title">
        <h2 id="editor-preview-title">Pré-visualização</h2>
        {previewCard === undefined ? (
          <p>Preencha os campos obrigatórios para ver a carta.</p>
        ) : (
          <FullCard card={previewCard} />
        )}
      </section>
    </div>
  )
}
