import { confirmMatchAttack, type CombatPreview } from '../state/attackPreview';
import {
  applyMatchAction,
  EVENT_NAMES,
  type MatchAction,
  type MatchState,
} from '../state/match';
import type { BattlefieldPosition } from '../types';
import { isCombatant } from '../state/deck';

export type CombatSide = 'friendly' | 'enemy';
type OtherAction = Exclude<MatchAction, { kind: 'attack' }>;
export type CombatAnimationStep =
  | {
      kind: 'strike';
      source: CombatSide;
      target: CombatSide;
      sourcePosition: BattlefieldPosition;
      targetPosition: BattlefieldPosition;
      durationMs: number;
    }
  | {
      kind: 'damage';
      target: CombatSide;
      position: BattlefieldPosition;
      damage: number;
      advantage: boolean;
      durationMs: number;
    }
  | {
      kind: 'ko';
      target: CombatSide;
      position: BattlefieldPosition;
      durationMs: number;
    }
  | {
      kind: 'action';
      action: OtherAction;
      side: CombatSide;
      durationMs: number;
    };

export interface CombatAnimationSession {
  before: MatchState;
  after: MatchState;
  steps: readonly CombatAnimationStep[];
  index: number;
  label?: string;
}

export function damagePopupLabel(damage: number): string {
  return damage > 0 ? `-${damage}` : '0';
}

/** Commit exactly one validated attack; the UI can replay or skip only its visuals. */
export function beginCombatAnimation(
  state: MatchState,
  preview: CombatPreview,
  animationInProgress: boolean,
  attackerSide: CombatSide = 'friendly',
): CombatAnimationSession {
  if (animationInProgress) throw new Error('Combat animation in progress');
  return {
    before: state,
    after: confirmMatchAttack(state, preview),
    steps: combatAnimationSteps(preview, attackerSide),
    index: 0,
  };
}

/** Visual sequence only. Every damage and KO value comes from the engine preview. */
export function combatAnimationSteps(
  preview: CombatPreview,
  attackerSide: CombatSide = 'friendly',
): readonly CombatAnimationStep[] {
  const { attackerPosition, targetPosition } = preview.action;
  const defenderSide = attackerSide === 'friendly' ? 'enemy' : 'friendly';
  const steps: CombatAnimationStep[] = [
    {
      kind: 'strike',
      source: attackerSide,
      target: defenderSide,
      sourcePosition: attackerPosition,
      targetPosition,
      durationMs: 360,
    },
    {
      kind: 'damage',
      target: defenderSide,
      position: targetPosition,
      damage: preview.attackDamage,
      advantage: preview.triangle === 'advantage',
      durationMs: 650,
    },
  ];

  if (preview.defenderHpAfter === 0) {
    steps.push({
      kind: 'ko',
      target: defenderSide,
      position: targetPosition,
      durationMs: 480,
    });
  } else if (preview.counterattackPossible) {
    steps.push(
      {
        kind: 'strike',
        source: defenderSide,
        target: attackerSide,
        sourcePosition: targetPosition,
        targetPosition: attackerPosition,
        durationMs: 360,
      },
      {
        kind: 'damage',
        target: attackerSide,
        position: attackerPosition,
        damage: preview.counterattackDamage,
        advantage: preview.triangle === 'disadvantage',
        durationMs: 650,
      },
    );
    if (preview.attackerHpAfter === 0)
      steps.push({
        kind: 'ko',
        target: attackerSide,
        position: attackerPosition,
        durationMs: 480,
      });
  }
  return steps;
}

/** Non-combat actions commit once; the UI holds the previous frame until the cue ends. */
export function beginActionAnimation(
  state: MatchState,
  action: OtherAction,
  animationInProgress: boolean,
  side: CombatSide = 'friendly',
): CombatAnimationSession {
  if (animationInProgress) throw new Error('Action animation in progress');
  const active = state.players.find(
    (player) => player.id === state.activePlayerId,
  )!;
  const unit =
    'position' in action
      ? active.board[action.position]
      : 'fromPosition' in action
        ? active.board[action.fromPosition]
        : null;
  const deployed =
    action.kind === 'deploy'
      ? active.hand.find((card) => card.instanceId === action.handId)
      : null;
  const subject =
    unit?.characterId ??
    (deployed && isCombatant(deployed) ? deployed.characterId : 'Unit');
  const label =
    action.kind === 'deploy'
      ? `Deploy ${subject}`
      : action.kind === 'move'
        ? `${subject} moves ${action.fromPosition} → ${action.toPosition}`
        : action.kind === 'swap'
          ? `Swap slots ${action.fromPosition} ↔ ${action.toPosition}`
          : action.kind === 'equip'
            ? `${subject} equips ${action.weapon}`
            : action.kind === 'event'
              ? `${EVENT_NAMES[action.event]} on ${subject}`
              : `Player ${active.id} ends the turn`;
  return {
    before: state,
    after: applyMatchAction(state, action),
    steps: [
      {
        kind: 'action',
        action,
        side,
        durationMs: action.kind === 'end-turn' ? 780 : 920,
      },
    ],
    index: 0,
    label,
  };
}
