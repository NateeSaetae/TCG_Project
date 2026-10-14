import type { CharacterGameplayData } from '../../../types/combat';

/** One gameplay definition shared by all Lilina card rarities. */
export const lilinaGameplay: CharacterGameplayData = {
  id: 'lilina',
  baseClass: 'Mage',
  displayType: 'Mage · Fire Mage',
  combatRole: {
    id: 'magic-dps-secondary-healer',
    displayName: 'Magic DPS / Secondary Healer',
  },
  allowedWeapons: ['Magic', 'Staff'],
  baseStats: {
    HP: 2800,
    ATK: 500,
    DEF: 500,
    MAG: 1900,
    RES: 1300,
    SPD: 1000,
  },
  skills: [
    {
      id: 'arcane-flame',
      name: 'Arcane Flame',
      description: 'Magic attack: +300 MAG for that attack.',
      type: 'Passive',
      trigger: 'on-attack',
      condition: { kind: 'weapon-is', weapon: 'Magic' },
      effect: { kind: 'attack-bonus', stat: 'MAG', amount: 300 },
    },
    {
      id: 'gentle-heart',
      name: 'Gentle Heart',
      description:
        'Staff healing restores an additional 300 HP, up to the ally’s maximum HP.',
      type: 'Passive',
      trigger: 'on-heal',
      runtime: 'pending',
      condition: { kind: 'weapon-is', weapon: 'Staff' },
      effect: { kind: 'heal-bonus', amount: 300, cap: 'target-max-hp' },
    },
  ],
};
