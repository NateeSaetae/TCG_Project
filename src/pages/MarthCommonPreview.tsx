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
  return (
    <section className="card-showcase">
      <div className="eyebrow">DEVELOPMENT PREVIEW · MARTH CARD COMPARISON</div>
      <h1>Marth · Hero of Altea</h1>
      <p>
        Compare the Common, Uncommon, Rare, Super Rare, and Ultra Rare prints.
        Move the pointer to inspect each card.
      </p>
      <div className="marth-preview-stage">
        <div
          className="marth-preview-comparison"
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
            <Card card={marthUltraRarePreview} face={face} small />
          </div>
        </div>
      </div>
      <div className="showcase-controls">
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
