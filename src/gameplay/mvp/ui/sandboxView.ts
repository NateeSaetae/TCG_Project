import type { MatchState, PlayerId } from '../state/match';
import type { MvpHandCard } from '../types';

/** Bot matches stay in player one's perspective; local matches follow the turn. */
export function visiblePlayers(state: MatchState, mode: 'bot' | 'local') {
  const friendlyId = mode === 'bot' ? 'one' : state.activePlayerId;
  return {
    friendly: state.players.find((player) => player.id === friendlyId)!,
    enemy: state.players.find((player) => player.id !== friendlyId)!,
  };
}

/** Enemy hands stay private; battlefield and discard instances are public. */
export function visibleCardInstance(
  state: MatchState,
  mode: 'bot' | 'local',
  playerId: PlayerId,
  instanceId: string,
): MvpHandCard | null {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player) return null;
  const board = player.board.find((card) => card?.instanceId === instanceId);
  if (board) return board;
  const discarded = player.discard.find(
    (card) => card.instanceId === instanceId,
  );
  if (discarded) return discarded;
  return playerId === visiblePlayers(state, mode).friendly.id
    ? (player.hand.find((card) => card.instanceId === instanceId) ?? null)
    : null;
}
