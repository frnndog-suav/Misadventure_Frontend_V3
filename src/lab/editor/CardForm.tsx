import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  cardSchema,
  elementSchema,
  enemyBehaviorSchema,
  enemyCategorySchema,
  equipmentSlotSchema,
  itemCategorySchema,
  modifierSchema,
  raritySchema,
  zoneTypeSchema,
  type Attribute,
  type AttributeCard,
} from '../../api/catalog'
import {
  ContentInvalidError,
  useCreateCard,
  useDeleteCard,
  useDuplicateCard,
  useEditorCollection,
  usePublishCard,
  useSaveCard,
  type ContentStatus,
  type EditorCard,
} from '../../api/editor'
import { effectSchema } from '../../api/effects'
import { ApiError } from '../../api/http'
import { effectMarkLabels, effectPolarityLabels } from '../../ui/labels'
import { FullCard } from '../../ui/cards/FullCard'
import { categoryCatalog } from '../../ui/categories'
import {
  attributeKindLabels,
  behaviorLabels,
  elementLabels,
  enemyCategoryLabels,
  enemyTypeLabels,
  playerClassLabels,
  rarityLabels,
  zoneActionLabels,
  zoneTypeLabels,
} from '../../ui/labels'
import { termCatalog } from '../../ui/terms'
import { ConfirmDialog } from './ConfirmDialog'
import {
  attributeOptions,
  options,
  useFieldErrors,
  type Errors,
  type FieldErrors,
} from './formHelpers'
import {
  classOrder,
  effectPartLabels,
  effectParts,
  emptyEffect,
  emptyEnemy,
  enemyTypeOrder,
  formFromCard,
  inputToCard,
  modifierOrder,
  parseEffectPart,
  sameForm,
  toInput,
  zoneActionOrder,
  type AbilityForm,
  type AttributeForm,
  type CardForm as CardFormValues,
  type CombatEventForm,
  type DimensionForm,
  type EffectForm,
  type EnemyForm,
  type EquipmentForm,
  type RandomEventForm,
  type ItemForm,
  type ZoneForm,
} from './cardFormValues'

const unavailable = 'Servidor indisponível. Tente novamente.'

const statusLabels = {
  draft: 'Rascunho',
  published: 'Publicada',
} satisfies Record<ContentStatus, string>

export function TextField({
  label,
  path,
  value,
  onChange,
  errors,
  multiline = false,
  readOnly = false,
  includeChildErrors = false,
  list,
}: {
  label: string
  path: string
  value: string
  onChange: (value: string) => void
  errors: Errors
  multiline?: boolean
  readOnly?: boolean
  includeChildErrors?: boolean
  /** `id` de um `datalist` com sugestões. */
  list?: string
}) {
  const id = useId()
  const props = {
    id,
    value,
    readOnly,
    list,
    'aria-describedby': errors.describedBy(path, includeChildErrors),
    onChange: (event: { target: { value: string } }) =>
      onChange(event.target.value),
  }
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea {...props} /> : <input type="text" {...props} />}
      {errors.errorText(path, includeChildErrors)}
    </div>
  )
}

export function SelectField<T extends string>({
  label,
  path,
  value,
  options,
  onChange,
  errors,
  emptyLabel = 'Escolha…',
  disabled = false,
}: {
  label: string
  path: string
  value: T | ''
  options: readonly { value: T; label: string }[]
  onChange: (value: T | '') => void
  errors: Errors
  /** Texto da opção vazia (ex.: "Sem elemento" quando vazio vira `null`). */
  emptyLabel?: string | null
  /** Seleção somente leitura (o `select` não tem `readOnly`). */
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-describedby={errors.describedBy(path)}
        onChange={(event) => {
          const next = options.find((o) => o.value === event.target.value)
          onChange(next ? next.value : '')
        }}
      >
        {emptyLabel !== null && <option value="">{emptyLabel}</option>}
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
export function ListField<T>({
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

const polarityOptions = options(['positive', 'negative'], effectPolarityLabels)
const markOptions = options(['buff', 'debuff'], effectMarkLabels)

function EffectFields({
  items,
  onChange,
  polarized = false,
  errors,
}: {
  items: EffectForm[]
  onChange: (effects: EffectForm[]) => void
  polarized?: boolean
  errors: Errors
}) {
  return (
    <ListField
      label="Efeitos"
      path="effects"
      items={items}
      onChange={onChange}
      newItem={emptyEffect}
      errors={errors}
      renderItem={(effect, index, setEffect) => {
        const path = `effects.${index}`
        const number = index + 1
        return (
          <>
            <TextField
              label={`Texto do efeito ${number}`}
              path={`${path}.text`}
              value={effect.text}
              onChange={(text) => setEffect({ ...effect, text })}
              errors={errors}
            />
            {effectParts.map((part) => (
              <TextField
                key={part}
                label={`${effectPartLabels[part]} do efeito ${number} (JSON)`}
                path={`${path}.${part}`}
                value={effect[part]}
                onChange={(value) => setEffect({ ...effect, [part]: value })}
                errors={errors}
                multiline
              />
            ))}
            {polarized ? (
              <SelectField
                label={`Polaridade do efeito ${number}`}
                path={`${path}.polarity`}
                value={effect.polarity}
                options={polarityOptions}
                onChange={(polarity) =>
                  setEffect({
                    ...effect,
                    polarity: polarity || effect.polarity,
                  })
                }
                errors={errors}
                emptyLabel={null}
              />
            ) : (
              <SelectField
                label={`Marcação do efeito ${number}`}
                path={`${path}.mark`}
                value={effect.mark ?? ''}
                options={markOptions}
                onChange={(mark) =>
                  setEffect({ ...effect, mark: mark || null })
                }
                errors={errors}
                emptyLabel="Sem marca"
              />
            )}
          </>
        )
      }}
    />
  )
}
const rarityOptions = options(raritySchema.options, rarityLabels)
const zoneTypeOptions = options(zoneTypeSchema.options, zoneTypeLabels)
/** "Forma das setas" (REQ-31); a opção vazia é "Não se aplica" (`null`). */
const arrowLayoutOptions = options(['straight', 'corner'] as const, {
  straight: 'Opostas',
  corner: 'Vizinhas',
})
const attributeKindOptions = options(
  Object.keys(attributeKindLabels) as AttributeCard['attributeKind'][],
  attributeKindLabels,
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
      <SelectField
        label="Forma das setas"
        path="arrowLayout"
        value={values.arrowLayout}
        options={arrowLayoutOptions}
        onChange={(arrowLayout) => set({ ...values, arrowLayout })}
        errors={errors}
        emptyLabel="Não se aplica"
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
      <EffectFields
        items={values.effects}
        onChange={(effects) => set({ ...values, effects })}
        errors={errors}
        polarized
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
      <EffectFields
        items={values.effects}
        onChange={(effects) => set({ ...values, effects })}
        errors={errors}
      />
    </>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
  describedBy,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  describedBy?: string
}) {
  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}

/** Listas cujos itens vão como `{ text }` no corpo (o erro vem em `.text`). */
const ruleTextLists = ['requirements']

/** Lista de textos ("Efeito {n}"); com `list`, cada campo sugere do `datalist`. */
function TextListField({
  label,
  itemLabel,
  path,
  items,
  onChange,
  errors,
  list,
}: {
  label: string
  itemLabel: string
  path: string
  items: readonly string[]
  onChange: (items: string[]) => void
  errors: Errors
  list?: string
}) {
  return (
    <ListField
      label={label}
      path={path}
      items={items}
      onChange={onChange}
      newItem={() => ''}
      errors={errors}
      renderItem={(text, index, setText) => (
        <TextField
          label={`${itemLabel} ${index + 1}`}
          path={`${path}.${index}${ruleTextLists.includes(path) ? '.text' : ''}`}
          value={text}
          onChange={setText}
          errors={errors}
          list={list}
        />
      )}
    />
  )
}

/** "Etiquetas" com as etiquetas já usadas na coleção como sugestão (REQ-21). */
function TagsField({
  values,
  set,
  suggestions,
  errors,
}: {
  values: string[]
  set: (tags: string[]) => void
  suggestions: readonly string[]
  errors: Errors
}) {
  const listId = useId()
  return (
    <>
      <datalist id={listId}>
        {suggestions.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
      <TextListField
        label="Etiquetas"
        itemLabel="Etiqueta"
        path="tags"
        items={values}
        onChange={set}
        errors={errors}
        list={listId}
      />
    </>
  )
}

const slotOptions = options(
  equipmentSlotSchema.options,
  Object.fromEntries(
    equipmentSlotSchema.options.map((s) => [s, categoryCatalog[s].label]),
  ) as Record<(typeof equipmentSlotSchema.options)[number], string>,
)
const itemCategoryOptions = options(
  itemCategorySchema.options,
  Object.fromEntries(
    itemCategorySchema.options.map((c) => [c, categoryCatalog[c].label]),
  ) as Record<(typeof itemCategorySchema.options)[number], string>,
)
const modifierOptions = options(
  modifierSchema.options,
  Object.fromEntries(
    modifierSchema.options.map((m) => [m, termCatalog[m].name]),
  ) as Record<(typeof modifierSchema.options)[number], string>,
)

function EquipmentFields({
  values,
  set,
  errors,
  tags,
}: {
  values: EquipmentForm
  set: (values: EquipmentForm) => void
  errors: Errors
  tags: readonly string[]
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
        label="Slot"
        path="slot"
        value={values.slot}
        options={slotOptions}
        onChange={(slot) => set({ ...values, slot })}
        errors={errors}
      />
      <TagsField
        values={values.tags}
        set={(next) => set({ ...values, tags: next })}
        suggestions={tags}
        errors={errors}
      />
      <ListField
        label="Modificadores"
        path="modifiers"
        items={values.modifiers}
        onChange={(modifiers) => set({ ...values, modifiers })}
        newItem={() => ({ modifier: '' as const, value: '' })}
        errors={errors}
        renderItem={(entry, index, setEntry) => (
          <>
            {index === 0 && <span>Principal</span>}
            <SelectField
              label={`Modificador ${index + 1}`}
              path={`modifiers.${index}.modifier`}
              value={entry.modifier}
              options={modifierOptions}
              onChange={(modifier) => setEntry({ ...entry, modifier })}
              errors={errors}
            />
            <TextField
              label={`Valor do modificador ${index + 1}`}
              path={`modifiers.${index}.value`}
              value={entry.value}
              onChange={(value) => setEntry({ ...entry, value })}
              errors={errors}
            />
          </>
        )}
      />
      <TextField
        label="Pico mínimo"
        path="peakRequirement"
        value={values.peakRequirement}
        onChange={(peakRequirement) => set({ ...values, peakRequirement })}
        errors={errors}
      />
      <fieldset aria-describedby={errors.describedBy('classRestriction')}>
        <legend>Restrição de classe</legend>
        {errors.errorText('classRestriction')}
        {classOrder.map((playerClass) => (
          <CheckboxField
            key={playerClass}
            label={playerClassLabels[playerClass]}
            checked={values.classRestriction.includes(playerClass)}
            onChange={(checked) =>
              set({
                ...values,
                classRestriction: classOrder.filter((c) =>
                  c === playerClass
                    ? checked
                    : values.classRestriction.includes(c),
                ),
              })
            }
          />
        ))}
      </fieldset>
      <CheckboxField
        label="Bloqueia escudo"
        checked={values.blocksShield}
        onChange={(blocksShield) => set({ ...values, blocksShield })}
      />
      <ListField<AbilityForm>
        label="Habilidades"
        path="abilities"
        items={values.abilities}
        onChange={(abilities) => set({ ...values, abilities })}
        newItem={() => ({ name: '', text: '' })}
        errors={errors}
        renderItem={(ability, index, setAbility) => (
          <>
            <TextField
              label={`Nome da habilidade ${index + 1}`}
              path={`abilities.${index}.name`}
              value={ability.name}
              onChange={(name) => setAbility({ ...ability, name })}
              errors={errors}
            />
            <TextField
              label={`Texto da habilidade ${index + 1}`}
              path={`abilities.${index}.text`}
              value={ability.text}
              onChange={(text) => setAbility({ ...ability, text })}
              errors={errors}
            />
            <TextField
              label={`Dados executáveis da habilidade ${index + 1} (JSON)`}
              path={`abilities.${index}.executable`}
              value={ability.executable ?? ''}
              onChange={(executable) => setAbility({ ...ability, executable })}
              errors={errors}
              multiline
              includeChildErrors
            />
          </>
        )}
      />
      <EffectFields
        items={values.effects}
        onChange={(effects) => set({ ...values, effects })}
        errors={errors}
      />
      <CheckboxField
        label="Refino"
        checked={values.refinement.enabled}
        onChange={(enabled) =>
          set({ ...values, refinement: { ...values.refinement, enabled } })
        }
      />
      {values.refinement.enabled && (
        <>
          <TextField
            label="Nível máximo"
            path="refinement.maxLevel"
            value={values.refinement.maxLevel}
            onChange={(maxLevel) =>
              set({ ...values, refinement: { ...values.refinement, maxLevel } })
            }
            errors={errors}
          />
          <TextField
            label="Materiais"
            path="refinement.materials.text"
            value={values.refinement.materials}
            onChange={(materials) =>
              set({
                ...values,
                refinement: { ...values.refinement, materials },
              })
            }
            errors={errors}
          />
        </>
      )}
      <CheckboxField
        label="Encantamento"
        checked={values.enchantment.enabled}
        onChange={(enabled) =>
          set({ ...values, enchantment: { ...values.enchantment, enabled } })
        }
      />
      {values.enchantment.enabled && (
        <TextField
          label="Texto do encantamento"
          path="enchantment.text"
          value={values.enchantment.text}
          onChange={(text) =>
            set({ ...values, enchantment: { ...values.enchantment, text } })
          }
          errors={errors}
        />
      )}
      <TextField
        label="Ajuste de preço"
        path="priceMultiplier"
        value={values.priceMultiplier}
        onChange={(priceMultiplier) => set({ ...values, priceMultiplier })}
        errors={errors}
      />
      <TextField
        label="Coletada com"
        path="scavengeTool"
        value={values.scavengeTool}
        onChange={(scavengeTool) => set({ ...values, scavengeTool })}
        errors={errors}
      />
    </>
  )
}

function ItemFields({
  values,
  set,
  errors,
  tags,
}: {
  values: ItemForm
  set: (values: ItemForm) => void
  errors: Errors
  tags: readonly string[]
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
        label="Categoria"
        path="itemCategory"
        value={values.itemCategory}
        options={itemCategoryOptions}
        onChange={(itemCategory) => set({ ...values, itemCategory })}
        errors={errors}
      />
      <TagsField
        values={values.tags}
        set={(next) => set({ ...values, tags: next })}
        suggestions={tags}
        errors={errors}
      />
      <EffectFields
        items={values.effects}
        onChange={(effects) => set({ ...values, effects })}
        errors={errors}
      />
      <TextField
        label="Tipo de ferramenta"
        path="toolKind"
        value={values.toolKind}
        onChange={(toolKind) => set({ ...values, toolKind })}
        errors={errors}
      />
      <fieldset aria-describedby={errors.describedBy('scavengeZoneTypes')}>
        <legend>Vasculha em</legend>
        {errors.errorText('scavengeZoneTypes')}
        {zoneTypeSchema.options.map((zoneType) => (
          <CheckboxField
            key={zoneType}
            label={zoneTypeLabels[zoneType]}
            checked={values.scavengeZoneTypes.includes(zoneType)}
            onChange={(checked) =>
              set({
                ...values,
                scavengeZoneTypes: zoneTypeSchema.options.filter((t) =>
                  t === zoneType
                    ? checked
                    : values.scavengeZoneTypes.includes(t),
                ),
              })
            }
          />
        ))}
      </fieldset>
      <TextField
        label="Coletada com"
        path="scavengeTool"
        value={values.scavengeTool}
        onChange={(scavengeTool) => set({ ...values, scavengeTool })}
        errors={errors}
      />
    </>
  )
}

const enemyCategoryOptions = options(
  enemyCategorySchema.options,
  enemyCategoryLabels,
)
const elementOptions = options(elementSchema.options, elementLabels)
const behaviorOptions = options(enemyBehaviorSchema.options, behaviorLabels)

/** "Coisa boa", "Coisa ruim" e "Sem fuga", comuns aos dois eventos. */
function OutcomeFields<T extends RandomEventForm | CombatEventForm>({
  values,
  set,
  errors,
}: {
  values: T
  set: (values: T) => void
  errors: Errors
}) {
  return (
    <>
      <TextField
        label="Coisa boa"
        path="goodOutcome.text"
        value={values.goodOutcome}
        onChange={(goodOutcome) => set({ ...values, goodOutcome })}
        errors={errors}
        multiline
      />
      <TextField
        label="Coisa ruim"
        path="badOutcome.text"
        value={values.badOutcome}
        onChange={(badOutcome) => set({ ...values, badOutcome })}
        errors={errors}
        multiline
      />
      <CheckboxField
        label="Sem fuga"
        checked={values.noEscape}
        describedBy={errors.describedBy('noEscape')}
        onChange={(noEscape) => set({ ...values, noEscape })}
      />
      {errors.errorText('noEscape')}
    </>
  )
}

function RandomEventFields({
  values,
  set,
  errors,
}: {
  values: RandomEventForm
  set: (values: RandomEventForm) => void
  errors: Errors
}) {
  const rules = values.rules
  return (
    <>
      <TextField
        label="Título"
        path="title"
        value={values.title}
        onChange={(title) => set({ ...values, title })}
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
      {rules ? (
        (
          [
            ['requirements', 'requirements', 'Requisitos executáveis (JSON)'],
            ['goodSteps', 'goodOutcome.steps', 'Passos da coisa boa (JSON)'],
            ['badSteps', 'badOutcome.steps', 'Passos da coisa ruim (JSON)'],
            [
              'threshold',
              'escapeThreshold',
              'Limiar de fuga (vazio usa o padrão)',
            ],
          ] as const
        ).map(([key, path, label]) => (
          <TextField
            key={path}
            label={label}
            path={path}
            value={rules[key]}
            onChange={(value) =>
              set({ ...values, rules: { ...rules, [key]: value } })
            }
            errors={errors}
            multiline={key !== 'threshold'}
            includeChildErrors
          />
        ))
      ) : (
        <>
          <TextListField
            label="Requisitos"
            itemLabel="Requisito"
            path="requirements"
            items={values.requirements}
            onChange={(requirements) => set({ ...values, requirements })}
            errors={errors}
          />
          <button
            type="button"
            onClick={() =>
              set({
                ...values,
                rules: {
                  requirements: JSON.stringify(
                    values.requirements.map((text) => ({ text })),
                    null,
                    2,
                  ),
                  goodSteps: '[]',
                  badSteps: '[]',
                  threshold: '',
                },
              })
            }
          >
            Configurar regras executáveis
          </button>
        </>
      )}
      <OutcomeFields values={values} set={set} errors={errors} />
    </>
  )
}

/** Campos de um inimigo; os rótulos levam "do inimigo {n}" (D-45). */
function EnemyFields({
  enemy,
  index,
  set,
  errors,
}: {
  enemy: EnemyForm
  index: number
  set: (enemy: EnemyForm) => void
  errors: Errors
}) {
  const n = index + 1
  const suffix = ` do inimigo ${n}`
  const path = (field: string) => `enemies.${index}.${field}`
  return (
    <>
      <TextField
        label={`Nome${suffix}`}
        path={path('name')}
        value={enemy.name}
        onChange={(name) => set({ ...enemy, name })}
        errors={errors}
      />
      <TextField
        label={`Texto de ambientação${suffix}`}
        path={path('flavorText')}
        value={enemy.flavorText}
        onChange={(flavorText) => set({ ...enemy, flavorText })}
        errors={errors}
        multiline
      />
      <TextField
        label={`Quantidade${suffix}`}
        path={path('count')}
        value={enemy.count}
        onChange={(count) => set({ ...enemy, count })}
        errors={errors}
      />
      <fieldset aria-describedby={errors.describedBy(path('enemyTypes'))}>
        <legend>{`Tipos${suffix}`}</legend>
        {errors.errorText(path('enemyTypes'))}
        {enemyTypeOrder.map((enemyType) => (
          <CheckboxField
            key={enemyType}
            label={enemyTypeLabels[enemyType]}
            checked={enemy.enemyTypes.includes(enemyType)}
            onChange={(checked) =>
              set({
                ...enemy,
                enemyTypes: enemyTypeOrder.filter((t) =>
                  t === enemyType ? checked : enemy.enemyTypes.includes(t),
                ),
              })
            }
          />
        ))}
      </fieldset>
      <TextField
        label={`Criatura${suffix}`}
        path={path('creature')}
        value={enemy.creature}
        onChange={(creature) => set({ ...enemy, creature })}
        errors={errors}
      />
      <SelectField
        label={`Categoria${suffix}`}
        path={path('enemyCategory')}
        value={enemy.enemyCategory}
        options={enemyCategoryOptions}
        onChange={(enemyCategory) => set({ ...enemy, enemyCategory })}
        errors={errors}
      />
      <SelectField
        label={`Elemento${suffix}`}
        path={path('element')}
        value={enemy.element}
        options={elementOptions}
        onChange={(element) => set({ ...enemy, element })}
        errors={errors}
        emptyLabel="Sem elemento"
      />
      <TextField
        label={`Vida${suffix}`}
        path={path('health')}
        value={enemy.health}
        onChange={(health) => set({ ...enemy, health })}
        errors={errors}
      />
      {modifierOrder.map((modifier) => (
        <TextField
          key={modifier}
          label={`${termCatalog[modifier].name}${suffix}`}
          path={path(`modifiers.${modifier}`)}
          value={enemy.modifiers[modifier]}
          onChange={(value) =>
            set({
              ...enemy,
              modifiers: { ...enemy.modifiers, [modifier]: value },
            })
          }
          errors={errors}
        />
      ))}
      <TextField
        label={`Vigor${suffix}`}
        path={path('vigor')}
        value={enemy.vigor}
        onChange={(vigor) => set({ ...enemy, vigor })}
        errors={errors}
      />
      <ListField<AbilityForm>
        label={`Habilidades${suffix}`}
        path={path('abilities')}
        items={enemy.abilities}
        onChange={(abilities) => set({ ...enemy, abilities })}
        newItem={() => ({ name: '', text: '' })}
        errors={errors}
        renderItem={(ability, j, setAbility) => (
          <>
            <TextField
              label={`Nome da habilidade ${j + 1}${suffix}`}
              path={path(`abilities.${j}.name`)}
              value={ability.name}
              onChange={(name) => setAbility({ ...ability, name })}
              errors={errors}
            />
            <TextField
              label={`Texto da habilidade ${j + 1}${suffix}`}
              path={path(`abilities.${j}.text`)}
              value={ability.text}
              onChange={(text) => setAbility({ ...ability, text })}
              errors={errors}
            />
            <TextField
              label={`Dados executáveis da habilidade ${j + 1} do inimigo ${index + 1} (JSON)`}
              path={`enemies.${index}.abilities.${j}.executable`}
              value={ability.executable ?? ''}
              onChange={(executable) => setAbility({ ...ability, executable })}
              errors={errors}
              multiline
              includeChildErrors
            />
          </>
        )}
      />
      <TextField
        label={`Regras de combate do inimigo ${index + 1} (JSON)`}
        path={path('combatRules')}
        value={enemy.combatRules ?? ''}
        onChange={(combatRules) => set({ ...enemy, combatRules })}
        errors={errors}
        multiline
        includeChildErrors
      />
      <SelectField
        label={`Comportamento${suffix}`}
        path={path('behavior')}
        value={enemy.behavior}
        options={behaviorOptions}
        onChange={(behavior) => set({ ...enemy, behavior })}
        errors={errors}
      />
    </>
  )
}

function CombatEventFields({
  values,
  set,
  errors,
}: {
  values: CombatEventForm
  set: (values: CombatEventForm) => void
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
      <TextField
        label="Texto de ambientação"
        path="flavorText"
        value={values.flavorText}
        onChange={(flavorText) => set({ ...values, flavorText })}
        errors={errors}
        multiline
      />
      <ListField
        label="Inimigos"
        path="enemies"
        items={values.enemies}
        onChange={(enemies) => set({ ...values, enemies })}
        newItem={emptyEnemy}
        errors={errors}
        renderItem={(enemy, index, setEnemy) => (
          <EnemyFields
            enemy={enemy}
            index={index}
            set={setEnemy}
            errors={errors}
          />
        )}
      />
      <TextField
        label="Limiar de fuga (vazio usa o padrão)"
        path="escapeThreshold"
        value={values.escapeThreshold ?? ''}
        onChange={(escapeThreshold) => set({ ...values, escapeThreshold })}
        errors={errors}
      />
      <TextField
        label="Passos da coisa boa (JSON)"
        path="goodOutcome.steps"
        value={values.goodSteps ?? ''}
        onChange={(goodSteps) => set({ ...values, goodSteps })}
        errors={errors}
        multiline
        includeChildErrors
      />
      <TextField
        label="Passos da coisa ruim (JSON)"
        path="badOutcome.steps"
        value={values.badSteps ?? ''}
        onChange={(badSteps) => set({ ...values, badSteps })}
        errors={errors}
        multiline
        includeChildErrors
      />
      <OutcomeFields values={values} set={set} errors={errors} />
    </>
  )
}

/** Carta de Dimensão (REQ-31); "Zona de chegada" vazia = `null` (sorteada). */
function DimensionFields({
  values,
  set,
  errors,
}: {
  values: DimensionForm
  set: (values: DimensionForm) => void
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
      <TextField
        label="Ordem de lançamento"
        path="releaseOrder"
        value={values.releaseOrder}
        onChange={(releaseOrder) => set({ ...values, releaseOrder })}
        errors={errors}
      />
      <TextField
        label="Zona de chegada"
        path="arrivalZoneTitle"
        value={values.arrivalZoneTitle}
        onChange={(arrivalZoneTitle) => set({ ...values, arrivalZoneTitle })}
        errors={errors}
      />
      <EffectFields
        items={values.effects}
        onChange={(effects) => set({ ...values, effects })}
        errors={errors}
        polarized
      />
      <ZoneDeckFields
        path="rewardDecks"
        label="Decks de recompensas"
        items={values.rewardDecks}
        onChange={(rewardDecks) => set({ ...values, rewardDecks })}
        errors={errors}
      />
      <ZoneDeckFields
        path="eventDecks"
        label="Decks de eventos"
        items={values.eventDecks ?? []}
        onChange={(eventDecks) => set({ ...values, eventDecks })}
        errors={errors}
      />
    </>
  )
}

function ZoneDeckFields({
  path,
  label,
  items,
  onChange,
  errors,
}: {
  path: 'rewardDecks' | 'eventDecks'
  label: string
  items: DimensionForm['rewardDecks']
  onChange: (decks: DimensionForm['rewardDecks']) => void
  errors: Errors
}) {
  return (
    <ListField
      label={label}
      path={path}
      items={items}
      onChange={onChange}
      newItem={(): DimensionForm['rewardDecks'][number] => ({
        zoneType: '',
        cards: [],
      })}
      errors={errors}
      renderItem={(deck, index, setDeck) => {
        const suffix = ` do deck ${index + 1}${path === 'eventDecks' ? ' de eventos' : ''}`
        const deckPath = `${path}.${index}`
        return (
          <>
            <SelectField
              label={`Tipo de zona${suffix}`}
              path={`${deckPath}.zoneType`}
              value={deck.zoneType}
              options={zoneTypeOptions}
              onChange={(zoneType) => setDeck({ ...deck, zoneType })}
              errors={errors}
            />
            <ListField
              label={`Cartas${suffix}`}
              path={`${deckPath}.cards`}
              items={deck.cards}
              onChange={(cards) => setDeck({ ...deck, cards })}
              newItem={() => ({ cardId: '', copies: '' })}
              errors={errors}
              renderItem={(entry, j, setEntry) => (
                <>
                  <TextField
                    label={`Carta ${j + 1}${suffix}`}
                    path={`${deckPath}.cards.${j}.cardId`}
                    value={entry.cardId}
                    onChange={(cardId) => setEntry({ ...entry, cardId })}
                    errors={errors}
                  />
                  <TextField
                    label={`Cópias da carta ${j + 1}${suffix}`}
                    path={`${deckPath}.cards.${j}.copies`}
                    value={entry.copies}
                    onChange={(copies) => setEntry({ ...entry, copies })}
                    errors={errors}
                  />
                </>
              )}
            />
          </>
        )
      }}
    />
  )
}

/** Campos do tipo da carta (REQ-21). */
function TypeFields({
  values,
  set,
  errors,
  tags,
}: {
  values: CardFormValues
  set: (values: CardFormValues) => void
  errors: Errors
  tags: readonly string[]
}) {
  switch (values.type) {
    case 'zone':
      return <ZoneFields values={values} set={set} errors={errors} />
    case 'attribute':
      return <AttributeFields values={values} set={set} errors={errors} />
    case 'equipment':
      return (
        <EquipmentFields
          values={values}
          set={set}
          errors={errors}
          tags={tags}
        />
      )
    case 'item':
      return (
        <ItemFields values={values} set={set} errors={errors} tags={tags} />
      )
    case 'randomEvent':
      return <RandomEventFields values={values} set={set} errors={errors} />
    case 'combatEvent':
      return <CombatEventFields values={values} set={set} errors={errors} />
    case 'dimension':
      return <DimensionFields values={values} set={set} errors={errors} />
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
  /** Texto inicial da área de status (ex.: "Cópia criada.", REQ-23). */
  message?: string
}

/** Nome da carta nos diálogos do REQ-23: "Nome" ou "Título" do tipo. */
function cardName(values: CardFormValues): string {
  return 'name' in values ? values.name : values.title
}

/** Diálogo aberto pelos botões do REQ-23. */
type Confirming = null | 'publish' | 'delete'

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
  onDuplicated,
  onDeleted,
  onDirtyChange,
}: {
  collectionId: string
  opened: OpenedCard
  onSaved: (cardId: string) => void
  /** O backend criou a cópia; quem abriu o formulário abre a cópia. */
  onDuplicated: (copy: EditorCard) => void
  /** A carta foi apagada; quem abriu o formulário o fecha. */
  onDeleted: () => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const [cardId, setCardId] = useState(opened.cardId)
  const [status, setStatus] = useState(opened.status)
  const [initial, setInitial] = useState(opened.values)
  const [values, setValues] = useState(opened.values)
  const [message, setMessage] = useState(opened.message ?? '')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>([])
  const [confirming, setConfirming] = useState<Confirming>(null)
  const create = useCreateCard()
  const save = useSaveCard()
  const publish = usePublishCard()
  const duplicate = useDuplicateCard()
  const remove = useDeleteCard()
  const busy =
    create.isPending ||
    save.isPending ||
    publish.isPending ||
    duplicate.isPending ||
    remove.isPending
  const invalidEffectFormat =
    'effects' in values &&
    values.effects.some((effect) =>
      effectParts.some(
        (part) =>
          !effectSchema.shape[part].safeParse(parseEffectPart(effect[part]))
            .success,
      ),
    )
  const errors = useFieldErrors(fieldErrors)
  // sugestões de etiqueta: a consulta já existe para a seção "Coleções" (cache)
  const tags = useEditorCollection(collectionId).data?.tags ?? []

  const dirty = !sameForm(values, initial)
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  const input = toInput(values)
  const previewCard =
    input === null
      ? undefined
      : cardSchema.safeParse(inputToCard(input, collectionId)).data

  function show(result: EditorCard, text: string): void {
    const next = formFromCard(result.card)
    setInitial(next)
    setValues(next)
    setCardId(result.card.id)
    setStatus(result.status)
    setMessage(text)
    onSaved(result.card.id)
  }

  function onSuccess(result: EditorCard): void {
    show(
      result,
      result.status === 'published' ? 'Carta salva.' : 'Rascunho salvo.',
    )
  }

  /** Limpa a área de status e os erros por campo antes de um envio. */
  function startRequest(): void {
    setMessage('')
    setFieldErrors([])
  }

  function onConfirm(): void {
    const action = confirming
    setConfirming(null)
    if (cardId === null || action === null) return
    startRequest()
    if (action === 'publish') {
      publish.mutate(cardId, {
        onSuccess: (result) => show(result, 'Carta publicada.'),
        onError,
      })
    } else {
      remove.mutate(cardId, { onSuccess: onDeleted, onError })
    }
  }

  function onDuplicate(): void {
    if (cardId === null) return
    startRequest()
    duplicate.mutate(cardId, { onSuccess: onDuplicated, onError })
  }

  function onError(error: Error): void {
    setMessage(error instanceof ApiError ? error.message : unavailable)
    setFieldErrors(
      error instanceof ContentInvalidError
        ? error.fields.map(({ path, message }) => ({
            path: path
              .replace(
                /^(effects\.\d+\.(?:trigger|cost|activation|duration))\..+$/,
                '$1',
              )
              .replace(
                /^((?:enemies\.\d+\.)?abilities\.\d+)\.(?!(?:name|text)$).+$/,
                '$1.executable',
              ),
            message,
          }))
        : [],
    )
  }

  function onSubmit(event: FormEvent): void {
    event.preventDefault()
    if (input === null) return
    startRequest()
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
          <TypeFields
            values={values}
            set={setValues}
            errors={errors}
            tags={tags}
          />
          <button type="submit" disabled={input === null || busy}>
            Salvar rascunho
          </button>
          <button
            type="button"
            disabled={cardId === null || status !== 'draft' || dirty || busy}
            onClick={() => setConfirming('publish')}
          >
            Publicar
          </button>
          <button
            type="button"
            disabled={cardId === null || busy}
            onClick={onDuplicate}
          >
            Duplicar
          </button>
          <button
            type="button"
            disabled={cardId === null || busy}
            onClick={() => setConfirming('delete')}
          >
            Excluir carta
          </button>
        </form>
        {confirming === 'publish' && (
          <ConfirmDialog
            title={`Publicar “${cardName(initial)}”?`}
            text="Depois de publicada, a carta entra no catálogo e nas partidas, e o identificador não pode mais mudar."
            confirmLabel="Publicar"
            cancelLabel="Cancelar"
            onConfirm={onConfirm}
            onCancel={() => setConfirming(null)}
          />
        )}
        {confirming === 'delete' && (
          <ConfirmDialog
            title={`Excluir “${cardName(initial)}”?`}
            text="A carta será apagada. Não dá para desfazer."
            confirmLabel="Excluir"
            cancelLabel="Cancelar"
            onConfirm={onConfirm}
            onCancel={() => setConfirming(null)}
          />
        )}
      </section>
      <section aria-labelledby="editor-preview-title">
        <h2 id="editor-preview-title">Pré-visualização</h2>
        {invalidEffectFormat ? (
          <p>Formato de efeito inválido.</p>
        ) : previewCard === undefined ? (
          <p>Preencha os campos obrigatórios para ver a carta.</p>
        ) : (
          <FullCard card={previewCard} />
        )}
      </section>
    </div>
  )
}
