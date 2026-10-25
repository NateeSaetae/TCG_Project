import type { BattlefieldPosition } from '../types';
import { applyMatchAction, type MatchState } from '../state/match';

const positions: readonly BattlefieldPosition[] = [0, 1, 2, 3, 4];

/** Ask the match engine which occupied enemy slots accept an Attack action. */
export function legalAttackTargets(
  match: MatchState,
  attackerPosition: BattlefieldPosition | null,
): BattlefieldPosition[] {
  if (attackerPosition === null || match.winner) return [];
  const opponent = match.players.find(
    (player) => player.id !== match.activePlayerId,
  )!;
  return positions.filter((targetPosition) => {
    if (!opponent.board[targetPosition]) return false;
    try {
      applyMatchAction(match, {
        kind: 'attack',
        attackerPosition,
        targetPosition,
      });
      return true;
    } catch {
      return false;
    }
  });
}
