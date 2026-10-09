import { useState } from 'react';
import { Card } from '../components/cards/Card';
import type { CardFace } from '../components/cards/TwoSidedCard';
import { SecretRareReveal } from '../components/pack/SecretRareReveal';
import { cards } from '../data/cards';
import { SHOWCASE_CARD_ID } from '../config/cardEffects';
import type { PointerPosition } from '../hooks/useCardPointer';

const card = cards.find((card) => card.id === SHOWCASE_CARD_ID)!;
export default function CardShowcase({ sound }: { sound: boolean }) {
  const [preview, setPreview] = useState<PointerPosition | null>(null);
  const [mode, setMode] = useState<'inspect' | 'reveal'>('inspect');
  const [face, setFace] = useState<CardFace>('front');
  const [replay, setReplay] = useState(0);
  const [revealed, setRevealed] = useState(false);
  function startReveal() {
    setMode('reveal');
    setFace('front');
    setRevealed(false);
    setReplay((value) => value + 1);
  }
  return (
    <section className="card-showcase">
      <div className="eyebrow">THE RELIQUARY · DEVELOPMENT SHOWCASE</div>
      <h1>Aether, World Unbound</h1>
      <p>
        Move across the card to explore its foil, reflected light and depth.
      </p>
      <a className="text-button" href="#/dev/marth-common">
        Preview Marth rarities →
      </a>
      <div className="showcase-stage">
        {mode === 'inspect' ? (
          <Card card={card} face={face} preview={preview} />
        ) : (
          <SecretRareReveal
            key={replay}
            autoPlay
            card={card}
            sound={sound}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onContinue={() => setMode('inspect')}
            continueLabel="Inspect revealed card"
          />
        )}
      </div>
      <div className="showcase-status" role="status">
        {mode === 'reveal'
          ? revealed
            ? 'Revealed. Hover to inspect, or click to return to controls.'
            : 'Playing the Secret Rare reveal…'
          : preview
            ? 'Fixed light position. Choose Live pointer to use your mouse.'
            : 'Live pointer · subtle foil at rest'}
      </div>
      <div className="showcase-controls">
        <button
          className="secondary"
          aria-pressed={mode === 'inspect' && face === 'front'}
          onClick={() => {
            setMode('inspect');
            setFace('front');
          }}
        >
          Show Front
        </button>
        <button
          className="secondary"
          aria-pressed={mode === 'inspect' && face === 'back'}
          onClick={() => {
            setMode('inspect');
            setFace('back');
          }}
        >
          Show Back
        </button>
        <button
          className="secondary"
          onClick={() => {
            setMode('inspect');
            setFace((value) => (value === 'front' ? 'back' : 'front'));
          }}
        >
          Flip Card
        </button>
        <button className="primary" onClick={startReveal}>
          Replay reveal ✧
        </button>
        <button
          className="secondary"
          onClick={() => {
            setMode('inspect');
            setPreview(null);
          }}
          aria-pressed={mode === 'inspect' && !preview}
        >
          Live pointer
        </button>
        {(['Top left', 'Center', 'Bottom right'] as const).map(
          (label, index) => (
            <button
              key={label}
              className="secondary"
              onClick={() => {
                setMode('inspect');
                setPreview({ x: index - 1, y: index - 1 });
              }}
              aria-pressed={
                mode === 'inspect' &&
                preview?.x === index - 1 &&
                preview?.y === index - 1
              }
            >
              {label}
            </button>
          ),
        )}
        {mode === 'inspect' && (
          <>
            {(['x', 'y'] as const).map((axis) => (
              <label key={axis}>
                Light {axis.toUpperCase()}
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={preview?.[axis] ?? 0}
                  onChange={(event) =>
                    setPreview((value) => ({
                      x: value?.x ?? 0,
                      y: value?.y ?? 0,
                      [axis]: Number(event.target.value),
                    }))
                  }
                />
              </label>
            ))}
          </>
        )}
      </div>
      <p style={{ marginTop: 22 }}>
        Preview only. Replays do not award cards or change pack odds.
      </p>
    </section>
  );
}
