import type { BattlefieldPosition, MvpAttackWeapon } from '../types';

export const MVP_MAX_HP = 10;
export const MVP_BOARD_SIZE = 5;
// Balance experiment V1: keep this value centralized for attacks and counters.
export const MVP_BASE_ATTACK_DAMAGE = 2;

const triangleAdvantage: Partial<Record<MvpAttackWeapon, MvpAttackWeapon>> = {
  Sword: 'Axe',
  Axe: 'Lance',
  Lance: 'Sword',
};

const rangeOffsets: Record<MvpAttackWeapon, readonly number[]> = {
  Sword: [0],
  Lance: [0],
  Axe: [0],
  Bow: [-1, 1],
  Magic: [-1, 0, 1],
};

export function isBattlefieldPosition(
  value: number,
): value is BattlefieldPosition {
  return Number.isInteger(value) && value >= 0 && value < MVP_BOARD_SIZE;
}

export function attackablePositions(
  position: BattlefieldPosition,
  weapon: MvpAttackWeapon,
): BattlefieldPosition[] {
  if (!isBattlefieldPosition(position))
    throw new Error(`Invalid battlefield position: ${position}`);
  const offsets = rangeOffsets[weapon];
  if (!offsets) throw new Error(`Weapon has no MVP attack range: ${weapon}`);
  return offsets
    .map((offset) => position + offset)
    .filter(isBattlefieldPosition);
}

export function isTargetInRange(
  attackerPosition: BattlefieldPosition,
  targetPosition: number,
  weapon: MvpAttackWeapon,
): boolean {
  return attackablePositions(attackerPosition, weapon).includes(
    targetPosition as BattlefieldPosition,
  );
}

/** Only Sword, Axe and Lance participate; disadvantage does not reduce damage. */
export function hasWeaponAdvantage(
  attackerWeapon: MvpAttackWeapon,
  defenderWeapon: MvpAttackWeapon,
): boolean {
  return triangleAdvantage[attackerWeapon] === defenderWeapon;
}

export interface MvpAttackResult {
  damage: number;
  weaponAdvantage: boolean;
}

/** Returns null for an out-of-range target, without changing either combatant. */
export function resolveBasicAttack({
  attackerPosition,
  targetPosition,
  attackerWeapon,
  defenderWeapon,
}: {
  attackerPosition: BattlefieldPosition;
  targetPosition: number;
  attackerWeapon: MvpAttackWeapon;
  defenderWeapon: MvpAttackWeapon;
}): MvpAttackResult | null {
  if (!isTargetInRange(attackerPosition, targetPosition, attackerWeapon))
    return null;
  const weaponAdvantage = hasWeaponAdvantage(attackerWeapon, defenderWeapon);
  return {
    damage: MVP_BASE_ATTACK_DAMAGE + (weaponAdvantage ? 1 : 0),
    weaponAdvantage,
  };
}

export function remainingHp(currentHp: number, damage: number): number {
  if (!Number.isInteger(currentHp) || currentHp < 0 || currentHp > MVP_MAX_HP)
    throw new Error(`Invalid MVP HP: ${currentHp}`);
  if (!Number.isInteger(damage) || damage < 0)
    throw new Error(`Invalid damage: ${damage}`);
  return Math.max(0, currentHp - damage);
}
