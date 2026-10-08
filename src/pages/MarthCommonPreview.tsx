import { useState, type CSSProperties } from 'react';
import { Card } from '../components/cards/Card';
import type { CardFace } from '../components/cards/TwoSidedCard';
import { marthPreview } from '../data/marthPreview';

export default function MarthCommonPreview() {
  const [face, setFace] = useState<CardFace>('front');
  const [width, setWidth] = useState(320);
  return (
    <section className="card-showcase">
      <div className="eyebrow">
        DEVELOPMENT PREVIEW · COMMON TEMPLATE · FE-001
      </div>
      <h1>Marth · Hero of Altea</h1>
      <p>Common print layout. Move the pointer to inspect the card.</p>
      <div className="marth-preview-stage">
        <div
          className="marth-preview-size"
          style={{ '--preview-width': width + 'px' } as CSSProperties}
        >
          <Card card={marthPreview} face={face} small />
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
        Preview only. Marth is not in booster packs or your saved collection.
      </p>
      <a className="text-button" href="#/dev/card-showcase">
        Return to Secret Rare showcase →
      </a>
    </section>
  );
}
