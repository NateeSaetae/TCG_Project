import { useState, type CSSProperties } from 'react';
import { CardRenderer } from '../../components/cards/CardRenderer';
import type { CardFace } from '../../components/cards/TwoSidedCard';
import { heroCards } from '../../data/catalog';
import { rarityName } from '../../config/rarity';
import type { HeroCardData } from '../../types/heroCard';

const heroGroups = Array.from(
  heroCards.reduce((groups, card) => {
    const key = card.name.toLocaleLowerCase();
    const cards = groups.get(key) ?? [];
    cards.push(card);
    groups.set(key, cards);
    return groups;
  }, new Map<string, HeroCardData[]>()),
);

export default function HeroPreview() {
  const [face, setFace] = useState<CardFace>('front');
  const [width, setWidth] = useState(280);
  const [patternedFoil, setPatternedFoil] = useState(true);
  const [enhancedMagic, setEnhancedMagic] = useState(true);

  return (
    <section className="card-showcase">
      <div className="eyebrow">DEVELOPMENT PREVIEW · HERO CARD COMPARISON</div>
      <h1>Hero Card Preview</h1>
      <p>
        Compare every registered hero card. Move the pointer to inspect each
        one.
      </p>
      <div className="showcase-controls">
        {heroCards.some((card) => card.magicEffects) && (
          <button
            className="secondary"
            aria-pressed={enhancedMagic}
            onClick={() => setEnhancedMagic((value) => !value)}
          >
            Magic effects: {enhancedMagic ? 'Enhanced' : 'Original'}
          </button>
        )}
        <button
          className="secondary"
          aria-pressed={patternedFoil}
          onClick={() => setPatternedFoil((value) => !value)}
        >
          Patterned foil border: {patternedFoil ? 'On' : 'Off'}
        </button>
        <button
          className="secondary"
          aria-pressed={face === 'front'}
          onClick={() => setFace('front')}
        >
          Show Front
        </button>
        <button
          className="secondary"
          aria-pressed={face === 'back'}
          onClick={() => setFace('back')}
        >
          Show Back
        </button>
        <button
          className="primary"
          onClick={() =>
            setFace((value) => (value === 'front' ? 'back' : 'front'))
          }
        >
          Flip Cards
        </button>
        <label>
          Preview size
          <input
            type="range"
            min="200"
            max="400"
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
          <span>{width}px</span>
        </label>
      </div>
      {heroGroups.map(([key, cards]) => (
        <div className="hero-preview-group" key={key}>
          <h2>
            {cards[0].name.charAt(0).toLocaleUpperCase() +
              cards[0].name.slice(1)}
          </h2>
          <div className="hero-preview-stage">
            <div
              className="hero-preview-comparison"
              data-foil-border={patternedFoil ? 'patterned' : 'plain'}
              style={{ '--preview-width': width + 'px' } as CSSProperties}
            >
              {cards.map((card) => (
                <div className="hero-preview-size" key={card.id}>
                  <div className="eyebrow">
                    {card.id} · {rarityName(card.rarity)}
                  </div>
                  <CardRenderer
                    card={
                      card.magicEffects
                        ? {
                            ...card,
                            magicEffects: {
                              ...card.magicEffects,
                              enabled: enhancedMagic,
                            },
                          }
                        : card
                    }
                    face={face}
                    small
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <p className="common-preview-note">
        Development preview. These cards are available in booster packs and your
        saved collection.
      </p>
      <a className="text-button" href="#home">
        Return home →
      </a>
    </section>
  );
}
