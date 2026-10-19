import { ephraimGameplay } from '../../../data/characters/ephraim/ephraimGameplay';
import { hectorGameplay } from '../../../data/characters/hector/hectorGameplay';
import { lilinaGameplay } from '../../../data/characters/lilina/lilinaGameplay';
import { lynGameplay } from '../../../data/characters/lyn/lynGameplay';
import { marthGameplay } from '../../../data/characters/marth/marthGameplay';
import { royGameplay } from '../../../data/characters/roy/royGameplay';
import type { CharacterGameplayData } from '../../../types/combat';
import type { MvpAttackWeapon } from '../types';
import { createMatch, type PlayerId, type TeamMember } from '../state/match';

const characters = [
  marthGameplay,
  royGameplay,
  hectorGameplay,
  ephraimGameplay,
  lilinaGameplay,
  lynGameplay,
];

export const testCharacterById = new Map(
  characters.map((character) => [character.id, character]),
);

function member(character: CharacterGameplayData): TeamMember {
  // Staff has no attack range in MVP; detailed Item effects are deferred.
  const allowedWeapons = character.allowedWeapons.filter(
    (weapon): weapon is MvpAttackWeapon =>
      weapon === 'Sword' ||
      weapon === 'Lance' ||
      weapon === 'Axe' ||
      weapon === 'Bow' ||
      weapon === 'Magic',
  );
  if (!allowedWeapons.length)
    throw new Error(`No MVP weapon for ${character.id}`);
  return {
    characterId: character.id,
    allowedWeapons,
    startingWeapon:
      character.id === 'lyn' && allowedWeapons.includes('Bow')
        ? 'Bow'
        : allowedWeapons[0],
  };
}

export function createTestMatch(firstPlayerId: PlayerId = 'one') {
  return createMatch(
    [
      {
        id: 'one',
        team: [
          marthGameplay,
          lynGameplay,
          royGameplay,
          hectorGameplay,
          lilinaGameplay,
        ].map(member),
        startingPositions: [1, 2],
      },
      {
        id: 'two',
        team: [
          hectorGameplay,
          ephraimGameplay,
          royGameplay,
          marthGameplay,
          lynGameplay,
        ].map(member),
        startingPositions: [1, 2],
      },
    ],
    firstPlayerId,
    { rallyDamageCap: 3 }, // Proposed playtest cap, not a final game rule.
  );
}
