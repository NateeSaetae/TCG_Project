import type { CharacterGameplayData } from '../../../types/combat';

/** Provisional gameplay values shared by every Ephraim rarity. */
export const ephraimGameplay: CharacterGameplayData = {
  id: 'ephraim',
  baseClass: 'Hero',
  displayType: 'Hero · Lord',
  combatRole: {
    id: 'lance-specialist-duelist',
    displayName: 'Lance Specialist / Duelist',
  },
  allowedWeapons: ['Lance', 'Axe'],
  baseStats: {
    HP: 3800,
    ATK: 1700,
    DEF: 1000,
    MAG: null,
    RES: 700,
    SPD: 1300,
  },
  skills: [
    {
      id: 'siegmunds-edge',
      name: "Siegmund's Edge",
      description: 'Lance attacks ignore 20% of the target’s DEF.',
      type: 'Passive',
      trigger: 'on-attack',
      condition: { kind: 'weapon-is', weapon: 'Lance' },
      effect: { kind: 'ignore-defense', percent: 20 },
    },
    {
      id: 'renais-assault',
      name: 'Renais Assault',
      description:
        'When attacking a target at full HP, gain +300 ATK for that attack.',
      type: 'Trigger',
      trigger: 'on-attack',
      condition: { kind: 'target-full-hp' },
      effect: { kind: 'attack-bonus', stat: 'ATK', amount: 300 },
    },
  ],
};
