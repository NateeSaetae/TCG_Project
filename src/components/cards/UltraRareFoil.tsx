import type { HeroCardData } from '../../types/heroCard';
import { MagicEffects } from './MagicEffects';
import { PatternedFoilBorder } from './PatternedFoilBorder';

/** Printed foil motifs remain visible; specular finishing honors reveal gating. */
export function UltraRareFoil({
  active,
  card,
}: {
  active: boolean;
  card?: HeroCardData;
}) {
  return (
    <>
      <PatternedFoilBorder active={active} />
      {card?.magicEffects?.enabled && (
        <MagicEffects active={active} profile={card.magicEffects} />
      )}
      {active && <div className="ultra-rare-foil" aria-hidden="true" />}
    </>
  );
}
