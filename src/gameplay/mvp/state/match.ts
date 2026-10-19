import type {
  BattlefieldPosition,
  MvpAttackWeapon,
  MvpBattlefield,
  MvpCombatant,
} from '../types';
import {
  isBattlefieldPosition,
  MVP_MAX_HP,
  remainingHp,
  resolveBasicAttack,
} from '../rules/combat';

export type PlayerId = 'one' | 'two';
export type EventType = 'heal' | 'rally' | 'stance' | 'retreat';
export const EVENT_TYPES: readonly EventType[] = [
  'heal',
  'rally',
  'stance',
  'retreat',
];
export const EVENT_NAMES: Record<EventType, string> = {
  heal: 'Heal',
  rally: 'Rally Strength',
  stance: 'Defensive Stance',
  retreat: 'Tactical Retreat',
};

export interface TeamMember {
  characterId: string;
  allowedWeapons: readonly MvpAttackWeapon[];
  startingWeapon: MvpAttackWeapon;
}

export interface PlayerSetup {
  id: PlayerId;
  team: readonly TeamMember[];
  startingPositions: readonly [BattlefieldPosition, BattlefieldPosition];
}

export interface PlayerState {
  id: PlayerId;
  board: MvpBattlefield;
  hand: readonly MvpCombatant[];
  mainActions: number;
  itemActions: number;
  attacks: number;
  repositions: number;
  eventUsedThisTurn: boolean;
  availableEvents: readonly EventType[];
  kos: number;
}

export interface MatchState {
  players: readonly [PlayerState, PlayerState];
  activePlayerId: PlayerId;
  turn: number;
  winner: PlayerId | null;
  rallyDamageCap: number;
  log: readonly string[];
}

export type MatchAction =
  | { kind: 'deploy'; handId: string; position: BattlefieldPosition }
  | {
      kind: 'attack';
      attackerPosition: BattlefieldPosition;
      targetPosition: BattlefieldPosition;
    }
  | {
      kind: 'move';
      fromPosition: BattlefieldPosition;
      toPosition: BattlefieldPosition;
    }
  | {
      kind: 'swap';
      fromPosition: BattlefieldPosition;
      toPosition: BattlefieldPosition;
    }
  | {
      kind: 'equip';
      position: BattlefieldPosition;
      weapon: MvpAttackWeapon;
    }
  | { kind: 'event'; event: EventType; position: BattlefieldPosition }
  | { kind: 'end-turn' };

const blankBoard = (): MvpBattlefield => [null, null, null, null, null];

export function createMatch(
  setups: readonly [PlayerSetup, PlayerSetup],
  firstPlayerId: PlayerId,
  options: { rallyDamageCap: number },
): MatchState {
  if (setups[0].id === setups[1].id)
    throw new Error('The test teams need different player IDs');
  if (!setups.some((setup) => setup.id === firstPlayerId))
    throw new Error('Select a first player explicitly');
  if (
    !Number.isSafeInteger(options.rallyDamageCap) ||
    options.rallyDamageCap < 1
  )
    throw new Error('Set a positive test damage cap');
  const players = setups.map((setup): PlayerState => {
    if (setup.team.length < 2 || setup.team.length > 10)
      throw new Error('Test teams need 2–10 characters');
    const [first, second] = setup.startingPositions;
    if (
      !isBattlefieldPosition(first) ||
      !isBattlefieldPosition(second) ||
      first === second
    )
      throw new Error('Starting positions must be two different board slots');
    const members = setup.team.map((member, index): MvpCombatant => {
      if (
        member.allowedWeapons.length === 0 ||
        !member.allowedWeapons.includes(member.startingWeapon)
      )
        throw new Error(`Invalid starting weapon for ${member.characterId}`);
      return {
        instanceId: `${setup.id}-${index}-${member.characterId}`,
        characterId: member.characterId,
        currentHp: MVP_MAX_HP,
        weapon: member.startingWeapon,
        allowedWeapons: member.allowedWeapons,
        newlyDeployed: false,
        exhausted: false,
        itemUsedThisTurn: false,
        rally: false,
        defensiveStance: false,
      };
    });
    const board = [...blankBoard()];
    board[first] = members[0];
    board[second] = members[1];
    return {
      id: setup.id,
      board: board as unknown as MvpBattlefield,
      hand: members.slice(2),
      mainActions: 3,
      itemActions: 3,
      attacks: 0,
      repositions: 0,
      eventUsedThisTurn: false,
      availableEvents: EVENT_TYPES,
      kos: 0,
    };
  }) as [PlayerState, PlayerState];
  return {
    players,
    activePlayerId: firstPlayerId,
    turn: 1,
    winner: null,
    rallyDamageCap: options.rallyDamageCap,
    log: [
      `Player ${firstPlayerId} begins. First player selected in test setup.`,
    ],
  };
}

function requireCharacter(
  board: MvpBattlefield,
  position: BattlefieldPosition,
): MvpCombatant {
  if (!isBattlefieldPosition(position)) throw new Error('Invalid board slot');
  const character = board[position];
  if (!character) throw new Error('No character in that slot');
  return character;
}

function replaceSlot(
  board: MvpBattlefield,
  position: BattlefieldPosition,
  character: MvpCombatant | null,
): MvpBattlefield {
  const next = [...board];
  next[position] = character;
  return next as unknown as MvpBattlefield;
}

function clearTurnStatuses(player: PlayerState): PlayerState {
  const clear = (character: MvpCombatant): MvpCombatant => ({
    ...character,
    newlyDeployed: false,
    exhausted: false,
    itemUsedThisTurn: false,
    rally: false,
  });
  return {
    ...player,
    board: player.board.map((character) =>
      character ? clear(character) : null,
    ) as unknown as MvpBattlefield,
    hand: player.hand.map(clear),
  };
}

function endTurn(state: MatchState, note: string): MatchState {
  const activeIndex = state.players.findIndex(
    (player) => player.id === state.activePlayerId,
  );
  const nextIndex = 1 - activeIndex;
  const players = [...state.players] as [PlayerState, PlayerState];
  players[activeIndex] = {
    ...clearTurnStatuses(players[activeIndex]),
    mainActions: 0,
    itemActions: 0,
  };
  players[nextIndex] = {
    ...players[nextIndex],
    mainActions: 3,
    itemActions: 3,
    attacks: 0,
    repositions: 0,
    eventUsedThisTurn: false,
  };
  return {
    ...state,
    players,
    activePlayerId: players[nextIndex].id,
    turn: state.turn + 1,
    log: [...state.log, note, `Player ${players[nextIndex].id} begins.`],
  };
}

function dealDamage(
  defender: MvpCombatant,
  damage: number,
): { character: MvpCombatant | null; dealt: number } {
  const dealt = Math.max(0, damage - (defender.defensiveStance ? 1 : 0));
  const hp = remainingHp(defender.currentHp, dealt);
  return {
    character:
      hp === 0 ? null : { ...defender, currentHp: hp, defensiveStance: false },
    dealt,
  };
}

export function applyMatchAction(
  state: MatchState,
  action: MatchAction,
): MatchState {
  if (state.winner) throw new Error('This match is finished');
  if (action.kind === 'end-turn')
    return endTurn(state, `Player ${state.activePlayerId} ended the turn.`);

  const activeIndex = state.players.findIndex(
    (player) => player.id === state.activePlayerId,
  );
  const otherIndex = 1 - activeIndex;
  const active = state.players[activeIndex];
  const other = state.players[otherIndex];
  const players = [...state.players] as [PlayerState, PlayerState];
  const notes: string[] = [];
  let nextActive = active;
  let nextOther = other;
  let winner: PlayerId | null = null;

  if (action.kind === 'equip') {
    if (active.itemActions < 1) throw new Error('No Item Actions remain');
    const character = requireCharacter(active.board, action.position);
    if (
      character.newlyDeployed ||
      character.exhausted ||
      character.itemUsedThisTurn
    )
      throw new Error('This character cannot use an Item Action now');
    if (!character.allowedWeapons.includes(action.weapon))
      throw new Error('This character cannot equip that weapon');
    if (character.weapon === action.weapon)
      throw new Error('That weapon is already equipped');
    nextActive = {
      ...active,
      board: replaceSlot(active.board, action.position, {
        ...character,
        weapon: action.weapon,
        itemUsedThisTurn: true,
      }),
      itemActions: active.itemActions - 1,
    };
    notes.push(`${character.characterId} equipped ${action.weapon}.`);
  } else {
    if (active.mainActions < 1) throw new Error('No Main Actions remain');
    if (action.kind === 'deploy') {
      if (
        !isBattlefieldPosition(action.position) ||
        active.board[action.position]
      )
        throw new Error('Deploy into an empty board slot');
      const character = active.hand.find(
        (entry) => entry.instanceId === action.handId,
      );
      if (!character) throw new Error('Select a character from your hand');
      nextActive = {
        ...active,
        board: replaceSlot(active.board, action.position, {
          ...character,
          newlyDeployed: true,
        }),
        hand: active.hand.filter((entry) => entry.instanceId !== action.handId),
        mainActions: active.mainActions - 1,
      };
      notes.push(`${character.characterId} deployed to ${action.position}.`);
    } else if (action.kind === 'move' || action.kind === 'swap') {
      if (active.repositions >= 2)
        throw new Error('Only two Move or Swap actions per turn');
      if (
        !isBattlefieldPosition(action.fromPosition) ||
        !isBattlefieldPosition(action.toPosition) ||
        Math.abs(action.fromPosition - action.toPosition) !== 1
      )
        throw new Error('Move or Swap requires an adjacent slot');
      const character = requireCharacter(active.board, action.fromPosition);
      if (character.newlyDeployed || character.exhausted)
        throw new Error(
          'Newly Deployed or Exhausted characters cannot move or swap',
        );
      const destination = active.board[action.toPosition];
      if (action.kind === 'move' && destination)
        throw new Error('Move destination must be empty');
      if (action.kind === 'swap' && !destination)
        throw new Error('Swap destination must contain a friendly character');
      if (
        action.kind === 'swap' &&
        destination &&
        (destination.newlyDeployed || destination.exhausted)
      )
        throw new Error('Newly Deployed or Exhausted characters cannot swap');
      let board = replaceSlot(active.board, action.fromPosition, destination);
      board = replaceSlot(board, action.toPosition, character);
      nextActive = {
        ...active,
        board,
        mainActions: active.mainActions - 1,
        repositions: active.repositions + 1,
      };
      notes.push(
        action.kind === 'move'
          ? `${character.characterId} moved from ${action.fromPosition} to ${action.toPosition}.`
          : `${character.characterId} swapped with ${destination!.characterId} (${action.fromPosition} / ${action.toPosition}).`,
      );
    } else if (action.kind === 'attack') {
      if (active.attacks >= 2) throw new Error('Only two attacks per turn');
      const attacker = requireCharacter(active.board, action.attackerPosition);
      const defender = requireCharacter(other.board, action.targetPosition);
      if (attacker.newlyDeployed || attacker.exhausted)
        throw new Error('This character cannot attack this turn');
      const attack = resolveBasicAttack({
        attackerPosition: action.attackerPosition,
        targetPosition: action.targetPosition,
        attackerWeapon: attacker.weapon,
        defenderWeapon: defender.weapon,
      });
      if (!attack) throw new Error('Target is outside weapon range');
      const damage = attacker.rally
        ? Math.min(state.rallyDamageCap, attack.damage + 1)
        : attack.damage;
      const hit = dealDamage(defender, damage);
      let attackingCharacter: MvpCombatant | null = {
        ...attacker,
        exhausted: true,
        rally: false,
      };
      let attackingBoard = replaceSlot(
        active.board,
        action.attackerPosition,
        attackingCharacter,
      );
      const defendingBoard = replaceSlot(
        other.board,
        action.targetPosition,
        hit.character,
      );
      let activeKos = active.kos;
      let otherKos = other.kos;
      notes.push(
        `${attacker.characterId} attacked ${defender.characterId} for ${hit.dealt}.`,
      );
      if (!hit.character) {
        activeKos++;
        notes.push(`${defender.characterId} was KO'd.`);
      } else {
        const counter = resolveBasicAttack({
          attackerPosition: action.targetPosition,
          targetPosition: action.attackerPosition,
          attackerWeapon: hit.character.weapon,
          defenderWeapon: attacker.weapon,
        });
        if (counter) {
          const returned = dealDamage(attackingCharacter, counter.damage);
          attackingCharacter = returned.character;
          attackingBoard = replaceSlot(
            attackingBoard,
            action.attackerPosition,
            attackingCharacter,
          );
          notes.push(
            `${defender.characterId} counterattacked for ${returned.dealt}.`,
          );
          if (!attackingCharacter) {
            otherKos++;
            notes.push(`${attacker.characterId} was KO'd.`);
          }
        }
      }
      nextActive = {
        ...active,
        board: attackingBoard,
        mainActions: active.mainActions - 1,
        attacks: active.attacks + 1,
        kos: activeKos,
      };
      nextOther = { ...other, board: defendingBoard, kos: otherKos };
      winner = activeKos >= 5 ? active.id : otherKos >= 5 ? other.id : null;
      if (winner) notes.push(`Player ${winner} wins with five KOs.`);
    } else if (action.kind === 'event') {
      if (active.eventUsedThisTurn) throw new Error('Only one Event per turn');
      if (!active.availableEvents.includes(action.event))
        throw new Error('That Event has already been used');
      const character = requireCharacter(active.board, action.position);
      let board = active.board;
      let hand = active.hand;
      if (action.event === 'heal') {
        board = replaceSlot(board, action.position, {
          ...character,
          currentHp: Math.min(MVP_MAX_HP, character.currentHp + 2),
        });
      } else if (action.event === 'rally') {
        board = replaceSlot(board, action.position, {
          ...character,
          rally: true,
        });
      } else if (action.event === 'stance') {
        board = replaceSlot(board, action.position, {
          ...character,
          defensiveStance: true,
        });
      } else {
        board = replaceSlot(board, action.position, null);
        hand = [
          ...hand,
          { ...character, newlyDeployed: false, exhausted: false },
        ];
      }
      nextActive = {
        ...active,
        board,
        hand,
        mainActions: active.mainActions - 1,
        eventUsedThisTurn: true,
        availableEvents: active.availableEvents.filter(
          (event) => event !== action.event,
        ),
      };
      notes.push(
        `${EVENT_NAMES[action.event]} used on ${character.characterId}.`,
      );
    }
  }

  players[activeIndex] = nextActive;
  players[otherIndex] = nextOther;
  const next: MatchState = {
    ...state,
    players,
    winner,
    log: [...state.log, ...notes],
  };
  return !winner && nextActive.mainActions === 0
    ? endTurn(
        next,
        `Player ${active.id} used all Main Actions; remaining Item Actions were forfeited.`,
      )
    : next;
}
