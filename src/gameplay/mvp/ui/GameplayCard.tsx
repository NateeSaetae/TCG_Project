import type { MvpHandCard } from '../types';
import { isCombatant } from '../state/deck';
import { EVENT_NAMES } from '../state/match';
import { cardForCombatant, nameOfCombatant } from './gameplayCardData';
import { ScaledHeroCard } from './ScaledHeroCard';

export function GameplayCardFace({
  card,
  initialWidth,
}: {
  card: MvpHandCard;
  initialWidth?: number;
}) {
  if (isCombatant(card)) {
    const print = cardForCombatant(card);
    return print ? (
      <ScaledHeroCard card={print} initialWidth={initialWidth} />
    ) : (
      <span className="mvp-face-fallback">{nameOfCombatant(card)}</span>
    );
  }
  return (
    <div className={`mvp-utility-face is-${card.kind}`}>
      <span className="mvp-utility-type">
        {card.kind === 'item' ? 'ITEM' : 'EVENT'}
      </span>
      <span className="mvp-utility-mark" aria-hidden="true">
        {card.kind === 'item' ? '⚔' : '✦'}
      </span>
      <strong>
        {card.kind === 'item' ? card.weapon : EVENT_NAMES[card.event]}
      </strong>
      <span className="mvp-utility-foot">THE HERO COLLECTION</span>
    </div>
  );
}
