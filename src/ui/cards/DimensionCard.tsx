import type { DimensionCard as DimensionCardData } from '../../api/catalog'
import { EnemyBlock } from './CombatEventCard'
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
      {card.completion && <CompletionDetails completion={card.completion} />}
      {card.rewardDecks.length > 0 && <RewardDecks decks={card.rewardDecks} />}
    </CardFrame>
  )
}

function CompletionDetails({
  completion,
}: {
  completion: NonNullable<DimensionCardData['completion']>
}) {
  const { zoneTitle, requirement, grandPrize, finalBoss } = completion
  return (
    <section className="game-card-block" aria-label="Conclusão">
      <h4 className="game-card-block-title">Conclusão</h4>
      <p>Zona de conclusão: {zoneTitle}</p>
      <LabeledList
        label="Requisito"
        items={requirement}
        render={({ cardId, count }) => (
          <>
            {count}× <CardName cardId={cardId} />
          </>
        )}
      />
      <section aria-label="Prêmio máximo">
        <h4 className="game-card-block-title">Prêmio máximo</h4>
        <LabeledList
          label="Cartas"
          items={grandPrize.cards}
          render={({ cardId, copies }) => (
            <>
              {copies}× <CardName cardId={cardId} />
            </>
          )}
        />
        <p>{grandPrize.gold} de ouro</p>
      </section>
      {finalBoss && (
        <section aria-label="Chefe final">
          <h4 className="game-card-block-title">Chefe final</h4>
          <p>{finalBoss.title}</p>
          {finalBoss.flavorText && (
            <p className="game-card-flavor">{finalBoss.flavorText}</p>
          )}
          {finalBoss.noEscape && <p>Sem fuga</p>}
          {finalBoss.enemies.map((enemy, index) => (
            <EnemyBlock key={index} enemy={enemy} />
          ))}
        </section>
      )}
    </section>
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
