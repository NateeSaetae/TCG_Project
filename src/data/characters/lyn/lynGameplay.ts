import type { CharacterGameplayData } from '../../../types/combat';

/** One gameplay definition shared by all Lyn card rarities. */
export const lynGameplay: CharacterGameplayData = {
  id: 'lyn',
  baseClass: 'Hero',
  displayType: 'Hero · Myrmidon',
  combatRole: {
    id: 'speed-attacker-precision-archer',
    displayName: 'Speed Attacker / Precision Archer',
  },
  allowedWeapons: ['Sword', 'Bow'],
  baseStats: {
    HP: 3100,
    ATK: 1400,
    DEF: 650,
    MAG: null,
    RES: 750,
    SPD: 1900,
  },
  skills: [
    {
      id: 'swift-strike',
      name: 'Swift Strike',
      description:
        'Against an enemy with lower effective SPD, gain +250 ATK for that attack.',
      type: 'Passive',
      trigger: 'on-attack',
      condition: { kind: 'target-spd-lower' },
      effect: { kind: 'attack-bonus', stat: 'ATK', amount: 250 },
    },
    {
      id: 'sacaen-precision',
      name: 'Sacaen Precision',
      description: 'Bow attacks ignore 15% of the target’s DEF.',
      type: 'Passive',
      trigger: 'on-attack',
      condition: { kind: 'weapon-is', weapon: 'Bow' },
      effect: { kind: 'ignore-defense', percent: 15 },
    },
  ],
};
