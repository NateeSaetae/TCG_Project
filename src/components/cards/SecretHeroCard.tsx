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
            <div className="scr-title-row">
              <span className="scr-rarity-badge" aria-label="Secret Rare">
                SER
                <svg
                  className="scr-rarity-seal"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M50 3 91 26.5V73.5L50 97 9 73.5V26.5Z" />
                  <path d="M50 11 84 30.5V69.5L50 89 16 69.5V30.5Z" />
                  <path d="M50 18 78 34V66L50 82 22 66V34Z" />
                  <path d="M50 17 54 22 50 27 46 22ZM50 73 54 78 50 83 46 78Z" />
                  <path d="M24 41 28 50 24 59M76 41 72 50 76 59" />
                </svg>
              </span>
              <h3>{hidden ? 'Undiscovered' : card.name}</h3>
            </div>
            <p>
              {hidden
                ? 'Summon this hero to discover their story.'
                : card.description}
            </p>
            <div className="scr-character-type">
              {hidden ? 'Unknown hero' : card.characterType}
            </div>
            <footer>
              <span>{card.id}</span>
            </footer>
          </div>
        </>
      }
    />
  );
}
