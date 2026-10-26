import type { MvpHandCard } from '../types';
import { isCombatant } from '../state/deck';
import { GameplayCardFace } from './GameplayCard';
import { cardForCombatant, nameOfCombatant } from './gameplayCardData';
import { EVENT_NAMES } from '../state/match';
import { rarityName } from '../../../config/rarity';

export function CardInspectionPanel({
  card,
  onClose,
}: {
  card: MvpHandCard | null;
  onClose: () => void;
}) {
  const print = card && isCombatant(card) ? cardForCombatant(card) : null;
  const title = card
    ? isCombatant(card)
      ? nameOfCombatant(card)
      : card.kind === 'item'
        ? `${card.weapon} Item`
        : EVENT_NAMES[card.event]
    : 'Select a card';
  return (
    <aside className="mvp-inspector" aria-label="Card inspection">
      <div className="mvp-inspector-heading">
        <span>INSPECT CARD</span>
        {card && (
          <button
            type="button"
            className="mvp-inspector-close"
            onClick={onClose}
            aria-label="Close card inspection"
          >
            ×
          </button>
        )}
      </div>
      {card ? (
        <>
          <div className="mvp-inspector-print">
            <GameplayCardFace card={card} initialWidth={208} />
          </div>
          <h2>{title}</h2>
          {isCombatant(card) ? (
            <div className="mvp-inspector-details">
              <span>
                {print ? rarityName(print.rarity) : 'Character'} ·{' '}
                {print?.characterType ?? 'Hero'}
              </span>
              <strong>Battle HP {card.currentHp}/10</strong>
              <span>Equipped: {card.weapon}</span>
              <span>
                {card.exhausted
                  ? 'Exhausted'
                  : card.newlyDeployed
                    ? 'Newly deployed'
                    : 'Ready'}
              </span>
            </div>
          ) : (
            <p>
              {card.kind === 'item'
                ? 'Equip this weapon using an Item Action.'
                : 'Play this Event using a Main Action.'}
            </p>
          )}
        </>
      ) : (
        <p>
          Click a battlefield card or a card in your hand to view its full print
          and battle details.
        </p>
      )}
    </aside>
  );
}
