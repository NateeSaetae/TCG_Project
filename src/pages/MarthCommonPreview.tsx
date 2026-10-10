import { marthSecretRarePreview } from '../data/marthSecretRarePreview';
import { useState, type CSSProperties } from 'react';
import { Card } from '../components/cards/Card';
import type { CardFace } from '../components/cards/TwoSidedCard';
import { marthPreview } from '../data/marthPreview';
import { marthUncommonPreview } from '../data/marthUncommonPreview';
import { marthRarePreview } from '../data/marthRarePreview';
import { marthSuperRarePreview } from '../data/marthSuperRarePreview';
import { marthUltraRarePreview } from '../data/marthUltraRarePreview';

export default function MarthCommonPreview() {
  const [face, setFace] = useState<CardFace>('front');
  const [width, setWidth] = useState(280);
  const [patternedFoil, setPatternedFoil] = useState(true);
  const [enhancedMagic, setEnhancedMagic] = useState(true);
  const urCard = {
    ...marthUltraRarePreview,
    magicEffects: marthUltraRarePreview.magicEffects
      ? { ...marthUltraRarePreview.magicEffects, enabled: enhancedMagic }
      : undefined,
  };
  return (
    <section className="card-showcase">
      <div className="eyebrow">DEVELOPMENT PREVIEW · MARTH CARD COMPARISON</div>
      <h1>Marth · Hero of Altea</h1>
      <p>
        Compare Common, Uncommon, Rare, Super Rare, Ultra Rare, and SCR prints.
        Move the pointer to inspect each card.
      </p>
      <div className="marth-preview-stage">
        <div
          className="marth-preview-comparison"
          data-foil-border={patternedFoil ? 'patterned' : 'plain'}
          style={{ '--preview-width': width + 'px' } as CSSProperties}
        >
          <div className="marth-preview-size">
            <div className="eyebrow">FE-001 · Common</div>
            <Card card={marthPreview} face={face} small />
          </div>
          <div className="marth-preview-size">
            <div className="eyebrow">FE-002 · Uncommon</div>
            <Card card={marthUncommonPreview} face={face} small />
          </div>
          <div className="marth-preview-size">
            <div className="eyebrow">FE-003 · Rare</div>
            <Card card={marthRarePreview} face={face} small />
          </div>
          <div className="marth-preview-size">
            <div className="eyebrow">FE-004 · Super Rare</div>
            <Card card={marthSuperRarePreview} face={face} small />
          </div>
          <div className="marth-preview-size">
            <div className="eyebrow">FE-005 · Ultra Rare</div>
            <Card card={urCard} face={face} small />
          </div>
          <div className="marth-preview-size">
            <div className="eyebrow">FE-006 · SCR / Secret Rare</div>
            <Card card={marthSecretRarePreview} face={face} small />
          </div>
        </div>
      </div>
      <div className="showcase-controls">
        <button
          className="secondary"
          aria-pressed={enhancedMagic}
          onClick={() => setEnhancedMagic((value) => !value)}
        >
          UR magic: {enhancedMagic ? 'Enhanced' : 'Original'}
        </button>
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
          Flip Card
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
      <p className="common-preview-note">
        Preview only. These Marth variants are not in booster packs or your
        saved collection.
      </p>
      <a className="text-button" href="#/dev/card-showcase">
        Return to Secret Rare showcase →
      </a>
    </section>
  );
}
