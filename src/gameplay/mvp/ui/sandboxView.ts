import type { MatchState } from '../state/match';

/** Bot matches stay in player one's perspective; local matches follow the turn. */
export function visiblePlayers(state: MatchState, mode: 'bot' | 'local') {
  const friendlyId = mode === 'bot' ? 'one' : state.activePlayerId;
  return {
    friendly: state.players.find((player) => player.id === friendlyId)!,
    enemy: state.players.find((player) => player.id !== friendlyId)!,
  };
}
