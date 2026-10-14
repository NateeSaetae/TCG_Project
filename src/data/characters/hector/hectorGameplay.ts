import type { CharacterGameplayData } from '../../../types/combat';

/** Provisional gameplay values shared by every Hector rarity. */
export const hectorGameplay: CharacterGameplayData = {
  id: 'hector',
  baseClass: 'Hero',
  displayType: 'Hero · Armored Lord',
  combatRole: {
    id: 'tank-counterattacker',
    displayName: 'Tank / Counterattacker',
  },
  allowedWeapons: ['Axe', 'Sword'],
  baseStats: {
    HP: 4500,
    ATK: 1400,
    DEF: 1500,
    MAG: null,
    RES: 600,
    SPD: 700,
  },
  skills: [
    {
      id: 'ostian-guard',
      name: 'Ostian Guard',
      description: 'Reduce incoming attack damage by 15%.',
      type: 'Passive',
      trigger: 'on-damage',
      condition: { kind: 'always' },
      effect: { kind: 'incoming-damage-reduction', percent: 15 },
    },
    {
      id: 'armads-retribution',
      name: 'Armads Retribution',
      description:
        'After surviving an enemy attack, deal 300 counter damage to the attacker once per enemy turn.',
      type: 'Trigger',
      trigger: 'on-hit',
      condition: { kind: 'always' },
      effect: {
        kind: 'counter-damage',
        amount: 300,
        limit: 'once-per-enemy-turn',
      },
    },
  ],
};
