import type { ZoneCard as ZoneCardData } from '../../api/catalog'
import { elementLabels, zoneActionLabels, zoneTypeLabels } from '../labels'
import { formatNumber } from './format'
import { CardFrame, CardName, Effects, LabeledList, Materials } from './parts'

/** Forma das setas (REQ-28); com `null`, nada aparece. */
const arrowLayoutLabels = {
  straight: 'Setas opostas',
  corner: 'Setas vizinhas',
} as const

/** Carta de zona (REQ-12, README 3.4). Polaridade com texto, não só cor. */
export function ZoneCard({ card }: { card: ZoneCardData }) {
  return (
    <CardFrame name={card.title}>
      <p className="game-card-kind">{zoneTypeLabels[card.zoneType]}</p>
      <p>{card.location}</p>
      <p>Setas de conexão: {card.connectionArrows}</p>
      {card.arrowLayout !== null && (
        <p>{arrowLayoutLabels[card.arrowLayout]}</p>
      )}
      <LabeledList
        label="Ações de zona"
        items={card.zoneActions}
        render={(a) => zoneActionLabels[a]}
      />
      <Effects effects={card.effects} />
      {card.market !== null && <Market market={card.market} />}
      {card.blacksmith !== null && <Blacksmith blacksmith={card.blacksmith} />}
    </CardFrame>
  )
}

/** Bloco "Mercado" (REQ-72): estoque na ordem recebida e se vende singles; o Estábulo (REQ-83). */
function Market({ market }: { market: NonNullable<ZoneCardData['market']> }) {
  return (
    <section aria-label="Mercado">
      <h4>Mercado</h4>
      {market.stock.length === 0 && <p>Sem estoque.</p>}
      <LabeledList
        label="Estoque"
        items={market.stock}
        render={(id) => <CardName cardId={id} />}
      />
      <p>{market.singles ? 'Vende singles' : 'Sem singles'}</p>
      <LabeledList
        label="Estábulo"
        items={market.mounts}
        render={(id) => <CardName cardId={id} />}
      />
    </section>
  )
}

/** Bloco "Ferreiro" (REQ-78): encantamentos oferecidos, com os materiais de cada um. */
function Blacksmith({
  blacksmith,
}: {
  blacksmith: NonNullable<ZoneCardData['blacksmith']>
}) {
  return (
    <section aria-label="Ferreiro">
      <h4>Ferreiro</h4>
      {blacksmith.enchantments.length === 0 ? (
        <p>Sem encantamentos.</p>
      ) : (
        <ul className="game-card-list" aria-label="Encantamentos">
          {blacksmith.enchantments.map((enchantment) => (
            <li key={enchantment.id}>
              <span>
                {enchantment.kind === 'element'
                  ? `${enchantment.name} — elemento ${elementLabels[enchantment.element]} (+${formatNumber(enchantment.bonusPercent)}%)`
                  : `${enchantment.name} — efeito`}
              </span>
              <Materials label="Materiais" materials={enchantment.materials} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
