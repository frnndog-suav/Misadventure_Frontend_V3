import { useState, type ReactNode } from 'react'
import { useCards, useCollections, type Card } from '../api/catalog'
import { ApiError } from '../api/http'
import {
  LabGrantInvalidError,
  LabGrantNoSpaceError,
  useLabGrant,
  type LabGrantInvalidDetails,
  type LabGrantNoSpaceDetails,
  type LabGrantRequest,
} from '../api/labGrant'
import { useParties, useParty, type Party } from '../api/parties'
import { cardTypeLabels } from '../ui/labels'

const unavailable = 'Servidor indisponível. Tente novamente.'

/** Erro → texto da área de status (D-01): `message` do §1.4 ou genérico. */
function errorText(error: Error): string {
  return error instanceof ApiError ? error.message : unavailable
}

/** Texto por motivo de `LAB_GRANT_INVALID` (REQ-46); sem texto: só a `message`. */
function invalidReasonText(
  reason: LabGrantInvalidDetails['fields'][number]['reason'],
): string | null {
  switch (reason) {
    case 'notGrantable':
      return 'Essa carta não pode ser doada (só equipamento, item ou atributo).'
    case 'notPositiveInteger':
      return 'Use um número inteiro a partir de 1.'
    case 'invalidBody':
    case 'required':
    case 'notString':
    case 'unknownKey':
    case 'unknownGrantType':
      return null
    default: {
      const _exhaustive: never = reason
      return _exhaustive
    }
  }
}

function noSpaceText(reason: LabGrantNoSpaceDetails['reason']): string {
  switch (reason) {
    case 'inventoryFull':
      return 'Inventário cheio.'
    case 'tcgFolderFull':
      return 'Pasta de TCG cheia.'
    case 'mountAlreadyOwned':
      return 'Já tem montaria.'
    default: {
      const _exhaustive: never = reason
      return _exhaustive
    }
  }
}

function grantErrorText(error: Error): string {
  if (error instanceof LabGrantInvalidError) {
    const texts = error.fields
      .map(({ reason }) => invalidReasonText(reason))
      .filter((text) => text !== null)
    return [error.message, ...texts].join(' ')
  }
  if (error instanceof LabGrantNoSpaceError) {
    return `${error.message} ${noSpaceText(error.reason)}`
  }
  return errorText(error)
}

function successText(party: Party, memberId: string): string {
  const member = party.members.find((m) => m.id === memberId)
  if (member === undefined) return 'Doação feita.'
  const { gold, inventory, tcgFolder } = member.player
  return `Doação feita. ${member.characterName}: ouro ${gold}, ${inventory.length} slots no inventário, ${tcgFolder.length} cartas diferentes na pasta.`
}

type GrantableCard = Extract<Card, { type: 'equipment' | 'item' | 'attribute' }>

/** Só as cartas que se doam (REQ-46), na ordem recebida. */
function isGrantable(card: Card): card is GrantableCard {
  return (
    card.type === 'equipment' ||
    card.type === 'item' ||
    card.type === 'attribute'
  )
}

function GrantForm({ party }: { party: Party }) {
  const collections = useCollections()
  const grant = useLabGrant()
  const [chosenMemberId, setMemberId] = useState<string | null>(null)
  const [kind, setKind] = useState<'card' | 'gold'>('card')
  const [chosenCollectionId, setCollectionId] = useState<string | null>(null)
  const [cardId, setCardId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [amount, setAmount] = useState('')
  const [grantedTo, setGrantedTo] = useState<string | null>(null)

  const memberId = chosenMemberId ?? party.members[0]?.id ?? null
  const collectionId = chosenCollectionId ?? collections.data?.[0]?.id ?? null

  let request: LabGrantRequest | null = null
  if (kind === 'card' && cardId !== '' && quantity.trim() !== '') {
    request = { type: 'card', cardId, quantity: Number(quantity) }
  } else if (kind === 'gold' && amount.trim() !== '') {
    request = { type: 'gold', amount: Number(amount) }
  }
  const canGrant = memberId !== null && request !== null && !grant.isPending
  const cards = useCards(collectionId)
  const cardsLoading =
    collections.isPending || (collectionId !== null && cards.isPending)
  const grantable = (cards.data ?? []).filter(isGrantable)

  let status = ''
  if (grant.isSuccess && grantedTo !== null) {
    status = successText(grant.data, grantedTo)
  } else if (grant.error) {
    status = grantErrorText(grant.error)
  } else if (kind === 'card' && collections.error) {
    status = errorText(collections.error)
  } else if (kind === 'card' && cards.error) {
    status = errorText(cards.error)
  }

  return (
    <>
      <fieldset role="radiogroup" aria-label="Membro">
        <legend>Membro</legend>
        {party.members.map((m) => (
          <label key={m.id}>
            <input
              type="radio"
              name="lab-grant-member"
              checked={m.id === memberId}
              onChange={() => setMemberId(m.id)}
            />
            {m.characterName}
          </label>
        ))}
      </fieldset>
      <fieldset role="radiogroup" aria-label="O que doar">
        <legend>O que doar</legend>
        <label>
          <input
            type="radio"
            name="lab-grant-kind"
            checked={kind === 'card'}
            onChange={() => setKind('card')}
          />
          Carta
        </label>
        <label>
          <input
            type="radio"
            name="lab-grant-kind"
            checked={kind === 'gold'}
            onChange={() => setKind('gold')}
          />
          Ouro
        </label>
      </fieldset>
      {kind === 'card' ? (
        <>
          <label>
            Coleção{' '}
            <select
              value={collectionId ?? ''}
              onChange={(e) => {
                setCollectionId(e.target.value)
                setCardId('')
              }}
            >
              {(collections.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Carta{' '}
            <select value={cardId} onChange={(e) => setCardId(e.target.value)}>
              {cardsLoading ? (
                <option value="">Carregando cartas…</option>
              ) : (
                <>
                  <option value="">Escolha…</option>
                  {grantable.map((card) => (
                    <option key={card.id} value={card.id}>
                      {`${card.name} · ${cardTypeLabels[card.type]}`}
                    </option>
                  ))}
                </>
              )}
            </select>
          </label>
          <label>
            Quantidade{' '}
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
        </>
      ) : (
        <label>
          Quantidade de ouro{' '}
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      )}
      <button
        type="button"
        disabled={!canGrant}
        onClick={() => {
          if (memberId === null || request === null) return
          setGrantedTo(memberId)
          grant.mutate({ partyId: party.id, memberId, grant: request })
        }}
      >
        Doar
      </button>
      <p role="status">{status}</p>
    </>
  )
}

/** Seção "Doação" do laboratório (REQ-46); não é ação do jogo (D-07, D-58). */
export function GrantSection() {
  const parties = useParties()
  const [partyId, setPartyId] = useState<string | null>(null)
  const party = useParty(partyId)

  let body: ReactNode
  if (parties.isPending) body = <p role="status">Carregando jogos…</p>
  else if (parties.error) body = <p role="status">{errorText(parties.error)}</p>
  else if (parties.data.length === 0) body = <p>Nenhum jogo salvo.</p>
  else {
    body = (
      <>
        <fieldset role="radiogroup" aria-label="Grupo">
          <legend>Grupo</legend>
          {parties.data.map((p) => (
            <label key={p.id}>
              <input
                type="radio"
                name="lab-grant-party"
                checked={p.id === partyId}
                onChange={() => setPartyId(p.id)}
              />
              {`${p.name} (${p.characterNames.join(', ')})`}
            </label>
          ))}
        </fieldset>
        {partyId !== null &&
          (party.isSuccess ? (
            <GrantForm key={partyId} party={party.data} />
          ) : (
            <p role="status">
              {party.isPending ? 'Carregando grupo…' : errorText(party.error)}
            </p>
          ))}
      </>
    )
  }

  return (
    <section aria-labelledby="lab-grant-title">
      <h2 id="lab-grant-title">Doação</h2>
      {body}
    </section>
  )
}
