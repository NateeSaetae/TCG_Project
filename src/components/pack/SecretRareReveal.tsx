import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Card } from '../cards/Card';
import { secretRevealTiming } from '../../config/cardEffects';
import { playTone } from '../../utils/sound';
import type { CardData } from '../../types';

type Stage = 'idle' | 'charging' | 'flipping' | 'settling' | 'ready';

/** Shared by real packs and the dev showcase; it never mutates the collection. */
export function SecretRareReveal({
  card,
  revealed,
  onReveal,
  onContinue,
  sound,
  continueLabel = 'Continue to next card',
  autoPlay = false,
}: {
  card: CardData;
  revealed: boolean;
  onReveal: () => void;
  onContinue: () => void;
  sound: boolean;
  continueLabel?: string;
  autoPlay?: boolean;
}) {
  const [stage, setStage] = useState<Stage>(
    revealed ? 'ready' : autoPlay ? 'charging' : 'idle',
  );
  const reduced = useReducedMotion();
  const lock = useRef(autoPlay);
  const latest = useRef({ onReveal, sound });
  latest.current = { onReveal, sound };
  const busy = stage !== 'idle' && stage !== 'ready';

  useEffect(() => {
    if (!busy) return;
    // A changed OS motion preference also completes an in-flight reveal safely.
    if (reduced) {
      setStage('ready');
      latest.current.onReveal();
      return;
    }
    const delay =
      stage === 'charging'
        ? secretRevealTiming.charge
        : stage === 'flipping'
          ? secretRevealTiming.flip
          : secretRevealTiming.settle;
    const timer = window.setTimeout(() => {
      if (stage === 'charging') setStage('flipping');
      else if (stage === 'flipping') {
        setStage('settling');
        playTone(latest.current.sound, 5);
      } else {
        setStage('ready');
        latest.current.onReveal();
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [stage, reduced, busy]);

  function activate() {
    if (stage === 'ready') {
      onContinue();
      return;
    }
    if (lock.current) return;
    lock.current = true;
    if (reduced) {
      setStage('ready');
      playTone(sound, 5);
      onReveal();
    } else setStage('charging');
  }

  return (
    <div className="secret-reveal" data-stage={stage} aria-busy={busy}>
      <div className="sr-reveal-light" aria-hidden="true" />
      <div className="sr-reveal-sparks" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <i
            key={index}
            style={{
              left: ((index * 31) % 100) + '%',
              top: ((index * 17) % 100) + '%',
            }}
          />
        ))}
      </div>
      <div className="sr-reveal-float">
        <button
          className="reveal-button"
          onClick={activate}
          disabled={busy}
          aria-label={
            stage === 'ready'
              ? continueLabel
              : busy
                ? 'Secret Rare awakening'
                : 'Reveal Secret Rare card'
          }
        >
          <Card
            card={card}
            face={stage === 'idle' || stage === 'charging' ? 'back' : 'front'}
            effectsActive={stage === 'settling' || stage === 'ready'}
          />
        </button>
      </div>
      <div className="sr-reveal-flash" aria-hidden="true" />
      <span className="sr-only" role="status">
        {busy
          ? 'A Secret Rare is awakening.'
          : stage === 'ready'
            ? card.name + ' revealed.'
            : 'Ready to reveal.'}
      </span>
    </div>
  );
}
