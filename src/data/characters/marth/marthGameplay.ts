import type { CharacterGameplayData } from '../../../types/combat';

/** Provisional balance values, independent of card rarity and artwork. */
export const marthGameplay: CharacterGameplayData = {
  id: 'marth',
  baseClass: 'Hero',
  displayType: 'Hero · Swordsman',
  allowedWeapons: ['Sword', 'Lance', 'Axe'],
  baseStats: {
    HP: 3500,
    ATK: 1500,
    DEF: 1000,
    MAG: null,
    RES: 800,
    SPD: 1400,
  },
  skills: [
    {
      id: 'heroes-resolve',
      name: "Hero's Resolve",
      description: 'Sword attack: +200 ATK for that attack.',
      type: 'Passive',
      trigger: 'on-attack',
      condition: { kind: 'weapon-is', weapon: 'Sword' },
      effect: { kind: 'attack-bonus', stat: 'ATK', amount: 200 },
    },
    {
      id: 'altean-legacy',
      name: 'Altean Legacy',
      description:
        'On defeating an enemy: other living allies gain +100 ATK through your next turn.',
      type: 'Trigger',
      trigger: 'on-kill',
      condition: { kind: 'always' },
      effect: {
        kind: 'team-buff',
        stat: 'ATK',
        amount: 100,
        target: 'other-living-allies',
        duration: 'through-next-own-turn',
      },
    },
  ],
};
