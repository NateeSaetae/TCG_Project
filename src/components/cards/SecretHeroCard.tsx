import type { HeroCardData } from '../../types/heroCard';
import type { PointerPosition } from '../../hooks/useCardPointer';
import { SecretRareSurface } from './SecretRareSurface';
import './secret-hero-card.css';

/** Hero metadata on the same physical full-art/foil surface as Aether. */
export function SecretHeroCard({
  card,
  small = false,
  hidden = false,
  preview,
  managedPointer = false,
  effectsActive = true,
}: {
  card: HeroCardData;
  small?: boolean;
  hidden?: boolean;
  preview?: PointerPosition | null;
  managedPointer?: boolean;
  effectsActive?: boolean;
}) {
  return (
    <SecretRareSurface
      card={card}
      label={card.name}
      small={small}
      hidden={hidden}
      preview={preview}
      managedPointer={managedPointer}
      effectsActive={effectsActive}
      className="scr-hero-card"
      information={
        <>
          <div className="scr-stats">
            <div
              className="scr-cost"
              aria-label={'Cost ' + (hidden ? 'unknown' : card.cost)}
            >
              <span>COST</span>
              <b>{hidden ? '?' : card.cost}</b>
            </div>
            <div className="scr-power">
              <b>{hidden ? '—' : card.power}</b>
              <span>POWER</span>
            </div>
          </div>
          <div className="card-copy scr-copy">
            <div className="card-rarity">
              <span aria-label="Secret Rare">SCR</span> · SECRET RARE ·
              CHARACTER
            </div>
            <h3>{hidden ? 'Undiscovered' : card.name}</h3>
            <p>
              {hidden
                ? 'Summon this hero to discover their story.'
                : card.description}
            </p>
            <div className="scr-character-type">
              {hidden ? 'Unknown hero' : card.characterType}
            </div>
            <footer>
              <span>THE HERO COLLECTION · EN</span>
              <span>{card.id}</span>
            </footer>
          </div>
        </>
      }
    />
  );
}
