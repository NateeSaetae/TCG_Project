import type { CharacterGameplayData } from '../../../types/combat';
export const royGameplay: CharacterGameplayData = {
  id: 'roy',
  baseClass: 'Hero',
  displayType: 'Hero · Swordsman',
  allowedWeapons: ['Sword', 'Lance'],
  baseStats: {
    HP: 3000,
    ATK: 1000,
    DEF: 800,
    MAG: null,
    RES: 700,
    SPD: 1200,
  },
  skills: [
    {
      id: 'blazing-resolve',
      name: 'Blazing Resolve',
      description: 'At 50% HP or less, gain +150 ATK when attacking.',
      type: 'Passive',
      trigger: 'on-attack',
      condition: { kind: 'hp-at-most-percent', percent: 50 },
      effect: { kind: 'attack-bonus', stat: 'ATK', amount: 150 },
    },
    {
      id: 'binding-flame',
      name: 'Binding Flame',
      description: 'Sword attack: +250 damage if target HP exceeds yours.',
      type: 'Trigger',
      trigger: 'on-attack',
      condition: {
        kind: 'all',
        conditions: [
          { kind: 'weapon-is', weapon: 'Sword' },
          { kind: 'target-hp-greater' },
        ],
      },
      effect: { kind: 'damage-bonus', amount: 250 },
    },
  ],
};
