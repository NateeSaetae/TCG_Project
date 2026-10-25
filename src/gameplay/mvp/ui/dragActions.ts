import type { BattlefieldPosition, MvpHandCard } from '../types';
import { isCombatant } from '../state/deck';
import {
  applyMatchAction,
  type MatchAction,
  type MatchState,
} from '../state/match';

export type DragSource =
  | { kind: 'hand'; instanceId: string }
  | { kind: 'board'; position: BattlefieldPosition; instanceId: string };

export type DropTarget = {
  side: 'friendly' | 'enemy';
  position: BattlefieldPosition;
};

function handAction(
  card: MvpHandCard,
  position: BattlefieldPosition,
): MatchAction {
  if (isCombatant(card))
    return { kind: 'deploy', handId: card.instanceId, position };
  if (card.kind === 'item')
    return {
      kind: 'equip',
      handId: card.instanceId,
      weapon: card.weapon,
      position,
    };
  return {
    kind: 'event',
    handId: card.instanceId,
    event: card.event,
    position,
  };
}

/** Translate an input gesture to an existing action. The match engine decides legality. */
export function actionForDrop(
  state: MatchState,
  source: DragSource,
  target: DropTarget,
): MatchAction | null {
  const active = state.players.find(
    (player) => player.id === state.activePlayerId,
  )!;
  if (source.kind === 'hand') {
    const card = active.hand.find(
      (entry) => entry.instanceId === source.instanceId,
    );
    return target.side === 'friendly' && card
      ? handAction(card, target.position)
      : null;
  }
  const character = active.board[source.position];
  if (!character || character.instanceId !== source.instanceId) return null;
  if (target.side === 'enemy')
    return {
      kind: 'attack',
      attackerPosition: source.position,
      targetPosition: target.position,
    };
  if (target.position === source.position) return null;
  return {
    kind: active.board[target.position] ? 'swap' : 'move',
    fromPosition: source.position,
    toPosition: target.position,
  };
}

/** Preview legal drop destinations without changing the authoritative state. */
export function legalDropTargets(
  state: MatchState,
  source: DragSource,
): DropTarget[] {
  if (state.winner) return [];
  const positions = [0, 1, 2, 3, 4] as const;
  const sides = ['friendly', 'enemy'] as const;
  const legal: DropTarget[] = [];
  for (const side of sides) {
    for (const position of positions) {
      const target = { side, position };
      const action = actionForDrop(state, source, target);
      if (!action) continue;
      try {
        applyMatchAction(state, action);
        legal.push(target);
      } catch {
        // Engine validation is authoritative.
      }
    }
  }
  return legal;
}
