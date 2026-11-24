import type { DimensionCard as DimensionCardData } from '../../api/catalog'
import { zoneTypeLabels } from '../labels'
import { CardFrame, CardName, Effects, LabeledList } from './parts'

/** Carta de Dimensão (REQ-28, README 3.2). A zona `null` é sorteada pelo backend. */
export function DimensionCard({ card }: { card: DimensionCardData }) {
  return (
    <CardFrame name={card.name} flavorText={card.flavorText}>
      <p>Ordem de lançamento {card.releaseOrder}</p>
      <p>
        Zona de chegada:{' '}
        {card.arrivalZoneTitle ??
          'sorteada entre as Urbanas sem efeito negativo'}
      </p>
      <Effects effects={card.effects} />
      {card.rewardDecks.length > 0 && <RewardDecks decks={card.rewardDecks} />}
    </CardFrame>
  )
}

/**
 * "Decks de recompensas" (REQ-48): nomes de `GET /catalog/cards/:cardId`;
 * até chegarem, "…"; com erro, o id da carta.
 */
function RewardDecks({ decks }: { decks: DimensionCardData['rewardDecks'] }) {
  return (
    <LabeledList
      label="Decks de recompensas"
      items={decks}
      render={(deck) => (
        <>
          {zoneTypeLabels[deck.zoneType]}
          <LabeledList
            label={zoneTypeLabels[deck.zoneType]}
            items={deck.cards}
            render={(c) => (
              <>
                {c.copies}× <CardName cardId={c.cardId} />
              </>
            )}
          />
        </>
      )}
    />
  )
}
