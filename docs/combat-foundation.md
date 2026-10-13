# PvE combat foundation

`src/data/characters/marth/marthGameplay.ts` is Marth's canonical gameplay record. All six Marth card prints reference the same object through `HeroCardData.gameplay`. Rarity, artwork, Cost and Power remain card presentation data; Power is not used as ATK.

`src/types/combat.ts` defines base stats, compatible weapons, skills, temporary modifiers, teams, turns, actions and events. `src/types/items.ts` keeps future item rarity and upgrade fields separate from character rarity. Characters without complete gameplay data can omit `gameplay` and still render.

`src/combat/engine.ts` is independent of React and uses immutable state updates. It can create a two-team battle, sum living members' effective SPD for provisional initiative, check weapon compatibility, evaluate attack passives, declare an attack, accept externally calculated damage, run on-kill triggers, expire buffs, and detect defeat. `MAG: null` remains unavailable rather than becoming zero.

The caller must supply resolved damage to `applyResolvedDamage`. There is no damage, healing, defense, resistance, action-count, AI or tie-break formula yet. Equal team Speed requires an explicit first team. A buff applied during a team's turn lasts through the end of that team's next turn; the engine tracks completed turns to expire it. These policies are extension points for the future PvE rules.

The Marth Common card uses the canonical record to show allowed weapons, a collapsible status rail, and two skills. Other rarities retain their approved presentation while sharing the same gameplay data.
