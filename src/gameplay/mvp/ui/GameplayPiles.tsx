import { CardBack } from '../../../components/cards/CardBack';
import type { MvpHandCard } from '../types';
import type { PlayerState } from '../state/match';
import { isCombatant } from '../state/deck';
import { EVENT_NAMES } from '../state/match';
import { nameOfCombatant } from './gameplayCardData';
import { GameplayCardFace } from './GameplayCard';

function usedCardName(card: MvpHandCard) {
  return isCombatant(card)
    ? `${nameOfCombatant(card)} · KO`
    : card.kind === 'item'
      ? `${card.weapon} Item`
      : EVENT_NAMES[card.event];
}

export function GameplayPiles({ player }: { player: PlayerState }) {
  return (
    <>
      <div
        className="mvp-pile mvp-deck-pile"
        aria-label={`Player ${player.id} deck: ${player.deck.length} cards`}
      >
        <div className="mvp-pile-art">
          <CardBack interactive={false} />
        </div>
        <span>
          DECK <b>{player.deck.length}</b>
        </span>
      </div>
      <details className="mvp-pile mvp-discard-pile">
        <summary
          aria-label={`Player ${player.id} discard: ${player.discard.length} cards`}
        >
          <span className="mvp-pile-art mvp-used-card" aria-hidden="true">
            {player.discard.length ? (
              <GameplayCardFace
                card={player.discard[player.discard.length - 1]}
                initialWidth={48}
              />
            ) : (
              <span className="mvp-discard-empty">✦</span>
            )}
          </span>
          <span>
            DISCARD <b>{player.discard.length}</b>
          </span>
        </summary>
        <div className="mvp-pile-list">
          <strong>Used / KO cards</strong>
          {player.discard.length ? (
            <ul>
              {player.discard.map((card) => (
                <li key={card.instanceId}>{usedCardName(card)}</li>
              ))}
            </ul>
          ) : (
            <p>No cards discarded.</p>
          )}
        </div>
      </details>
    </>
  );
}
