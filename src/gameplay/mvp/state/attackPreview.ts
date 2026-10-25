import { hasWeaponAdvantage } from '../rules/combat';
import type { MvpCombatant } from '../types';
import {
  applyMatchAction,
  simulateMatchAttack,
  type MatchAction,
  type MatchState,
} from './match';

type AttackAction = Extract<MatchAction, { kind: 'attack' }>;

export interface CombatPreview {
  readonly stateAtPreview: MatchState;
  readonly action: AttackAction;
  readonly attacker: MvpCombatant;
  readonly defender: MvpCombatant;
  readonly attackDamage: number;
  readonly counterattackPossible: boolean;
  readonly counterattackDamage: number;
  readonly attackerHpAfter: number;
  readonly defenderHpAfter: number;
  readonly triangle: 'advantage' | 'disadvantage' | 'neutral';
}

/** Simulate the authoritative Attack action without committing its next state. */
export function previewMatchAttack(
  state: MatchState,
  action: AttackAction,
): CombatPreview {
  const resolved = simulateMatchAttack(state, action);
  const { attacker, defender } = resolved;
  const attackerHpAfter =
    resolved.nextActive.board[action.attackerPosition]?.currentHp ?? 0;
  const defenderHpAfter =
    resolved.nextOther.board[action.targetPosition]?.currentHp ?? 0;

  return {
    stateAtPreview: state,
    action,
    attacker,
    defender,
    attackDamage: resolved.attackDamage,
    counterattackPossible: resolved.counterattackPossible,
    counterattackDamage: resolved.counterattackDamage,
    attackerHpAfter,
    defenderHpAfter,
    triangle: hasWeaponAdvantage(attacker.weapon, defender.weapon)
      ? 'advantage'
      : hasWeaponAdvantage(defender.weapon, attacker.weapon)
        ? 'disadvantage'
        : 'neutral',
  };
}

/** Reject a preview from an earlier state, then let the engine validate again. */
export function confirmMatchAttack(
  state: MatchState,
  preview: CombatPreview,
): MatchState {
  if (state !== preview.stateAtPreview)
    throw new Error('Combat preview is stale. Select a target again.');
  return applyMatchAction(state, preview.action);
}
