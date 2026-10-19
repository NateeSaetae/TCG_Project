import { isTargetInRange, resolveBasicAttack } from '../rules/combat';
import {
  applyMatchAction,
  type MatchAction,
  type MatchState,
  type PlayerId,
  type PlayerState,
} from '../state/match';
import type { BattlefieldPosition, MvpCombatant } from '../types';

const positions: readonly BattlefieldPosition[] = [0, 1, 2, 3, 4];

function hpOnBoard(player: PlayerState): number {
  return player.board.reduce(
    (total, character) => total + (character?.currentHp ?? 0),
    0,
  );
}

function canAttack(character: MvpCombatant): boolean {
  return !character.newlyDeployed && !character.exhausted;
}

function futureAttackValue(
  player: PlayerState,
  opponent: PlayerState,
  source: BattlefieldPosition,
): number {
  const attacker = player.board[source];
  if (!attacker || !canAttack(attacker)) return 0;
  let best = 0;
  for (const target of positions) {
    const defender = opponent.board[target];
    if (!defender) continue;
    const attack = resolveBasicAttack({
      attackerPosition: source,
      targetPosition: target,
      attackerWeapon: attacker.weapon,
      defenderWeapon: defender.weapon,
    });
    if (attack) best = Math.max(best, attack.damage);
  }
  return best;
}

function distanceToAttack(
  position: BattlefieldPosition,
  character: MvpCombatant,
  opponent: PlayerState,
): number {
  let nearest = Infinity;
  for (const target of positions) {
    if (!opponent.board[target]) continue;
    for (const possibleSource of positions) {
      if (isTargetInRange(possibleSource, target, character.weapon))
        nearest = Math.min(nearest, Math.abs(position - possibleSource));
    }
  }
  return nearest;
}

/** Deterministic playtest opponent. Every candidate is checked by the match rules. */
export function chooseBotAction(
  state: MatchState,
  botPlayerId: PlayerId = 'two',
): MatchAction | null {
  if (state.winner || state.activePlayerId !== botPlayerId) return null;
  const bot = state.players.find((player) => player.id === botPlayerId)!;
  const opponent = state.players.find((player) => player.id !== botPlayerId)!;
  let best: { action: MatchAction; score: number } = {
    action: { kind: 'end-turn' },
    score: 0,
  };

  function consider(action: MatchAction, score: (next: MatchState) => number) {
    try {
      const next = applyMatchAction(state, action);
      const value = score(next);
      if (value > best.score) best = { action, score: value };
    } catch {
      // Invalid candidate: the shared match engine remains the authority.
    }
  }

  if (bot.mainActions > 0) {
    for (const source of positions) {
      const attacker = bot.board[source];
      if (!attacker || !canAttack(attacker)) continue;
      for (const target of positions) {
        if (!opponent.board[target]) continue;
        consider(
          { kind: 'attack', attackerPosition: source, targetPosition: target },
          (next) => {
            const afterBot = next.players.find(
              (player) => player.id === botPlayerId,
            )!;
            const afterOpponent = next.players.find(
              (player) => player.id !== botPlayerId,
            )!;
            return (
              (hpOnBoard(opponent) - hpOnBoard(afterOpponent)) * 12 +
              (afterBot.kos - bot.kos) * 70 -
              (hpOnBoard(bot) - hpOnBoard(afterBot)) * 7 -
              (afterOpponent.kos - opponent.kos) * 80 +
              (next.winner === botPlayerId ? 1000 : 0)
            );
          },
        );
      }
    }

    if (!bot.eventUsedThisTurn) {
      for (const position of positions) {
        const character = bot.board[position];
        if (!character) continue;
        if (bot.availableEvents.includes('heal')) {
          consider({ kind: 'event', event: 'heal', position }, () =>
            character.currentHp <= 6
              ? Math.min(2, 10 - character.currentHp) * 8
              : 0,
          );
        }
        if (bot.availableEvents.includes('rally') && canAttack(character)) {
          let useful = false;
          for (const target of positions) {
            const defender = opponent.board[target];
            if (!defender) continue;
            const attack = resolveBasicAttack({
              attackerPosition: position,
              targetPosition: target,
              attackerWeapon: character.weapon,
              defenderWeapon: defender.weapon,
            });
            if (
              attack &&
              !character.rally &&
              attack.damage < state.rallyDamageCap &&
              defender.currentHp >
                attack.damage - (defender.defensiveStance ? 1 : 0)
            )
              useful = true;
          }
          if (useful)
            consider({ kind: 'event', event: 'rally', position }, () => 20);
        }
        if (
          bot.availableEvents.includes('stance') &&
          !character.defensiveStance
        ) {
          const threatened = positions.some((enemyPosition) => {
            const enemy = opponent.board[enemyPosition];
            return (
              enemy && isTargetInRange(enemyPosition, position, enemy.weapon)
            );
          });
          if (threatened && character.currentHp <= 3)
            consider({ kind: 'event', event: 'stance', position }, () => 16);
        }
        if (bot.availableEvents.includes('retreat') && character.currentHp <= 2)
          consider({ kind: 'event', event: 'retreat', position }, () => 24);
      }
    }

    if (bot.hand.length) {
      for (const member of bot.hand) {
        for (const position of positions) {
          if (bot.board[position]) continue;
          const facingEnemy = opponent.board[position] != null;
          consider(
            { kind: 'deploy', handId: member.instanceId, position },
            () =>
              8 +
              (bot.board.filter(Boolean).length < 3 ? 6 : 0) +
              (facingEnemy ? 2 : 0),
          );
        }
      }
    }

    if (bot.repositions < 2) {
      for (const fromPosition of positions) {
        const character = bot.board[fromPosition];
        if (!character || !canAttack(character)) continue;
        const beforeAttack = futureAttackValue(bot, opponent, fromPosition);
        const beforeDistance = distanceToAttack(
          fromPosition,
          character,
          opponent,
        );
        for (const toPosition of positions) {
          if (Math.abs(fromPosition - toPosition) !== 1) continue;
          const destination = bot.board[toPosition];
          if (destination && !canAttack(destination)) continue;
          const beforeDestinationAttack = destination
            ? futureAttackValue(bot, opponent, toPosition)
            : 0;
          consider(
            { kind: destination ? 'swap' : 'move', fromPosition, toPosition },
            (next) => {
              const after = next.players.find(
                (player) => player.id === botPlayerId,
              )!;
              const attackGain =
                futureAttackValue(after, opponent, toPosition) +
                (destination
                  ? futureAttackValue(after, opponent, fromPosition)
                  : 0) -
                beforeAttack -
                beforeDestinationAttack;
              if (attackGain > 0) return 9 + attackGain * 3;
              if (destination) return 0;
              const afterDistance = distanceToAttack(
                toPosition,
                character,
                opponent,
              );
              return afterDistance < beforeDistance
                ? 6 + (beforeDistance - afterDistance) * 2
                : 0;
            },
          );
        }
      }
    }
  }

  if (bot.itemActions > 0) {
    for (const position of positions) {
      const character = bot.board[position];
      if (!character || !canAttack(character) || character.itemUsedThisTurn)
        continue;
      const before = futureAttackValue(bot, opponent, position);
      for (const weapon of character.allowedWeapons) {
        if (weapon === character.weapon) continue;
        consider({ kind: 'equip', position, weapon }, (next) => {
          const after = next.players.find(
            (player) => player.id === botPlayerId,
          )!;
          const improvement =
            futureAttackValue(after, opponent, position) - before;
          return improvement > 0 ? 25 + improvement * 4 : 0;
        });
      }
    }
  }

  return best.action;
}
