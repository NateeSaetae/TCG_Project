import type { WeaponType } from '../../types/combat';

/** Only these weapons have attack ranges in MVP Ver.1. */
export type MvpAttackWeapon = Extract<
  WeaponType,
  'Sword' | 'Lance' | 'Axe' | 'Bow' | 'Magic'
>;

export type BattlefieldPosition = 0 | 1 | 2 | 3 | 4;

/** A battle instance refers to a character, never to a collectible print. */
export interface MvpCombatant {
  instanceId: string;
  characterId: string;
  /** The collectible print supplies artwork only; it never changes MVP combat. */
  cardId?: string;
  currentHp: number;
  /** Weapon used before a temporary Item is equipped. */
  baseWeapon: MvpAttackWeapon;
  weapon: MvpAttackWeapon;
  /** Revert to baseWeapon when this player's next turn begins. */
  temporaryItemEquipped: boolean;
  allowedWeapons: readonly MvpAttackWeapon[];
  newlyDeployed: boolean;
  exhausted: boolean;
  itemUsedThisTurn: boolean;
  rally: boolean;
  defensiveStance: boolean;
}

export type MvpDeckCard =
  | { kind: 'character'; instanceId: string; cardId: string }
  | { kind: 'item'; instanceId: string; weapon: MvpAttackWeapon }
  | {
      kind: 'event';
      instanceId: string;
      event: 'heal' | 'rally' | 'stance' | 'retreat';
    };

export type MvpHandCard =
  MvpCombatant | Exclude<MvpDeckCard, { kind: 'character' }>;

export type MvpBattlefield = readonly [
  MvpCombatant | null,
  MvpCombatant | null,
  MvpCombatant | null,
  MvpCombatant | null,
  MvpCombatant | null,
];
