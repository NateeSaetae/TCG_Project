import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Card } from '../cards/Card';
import { CARD_FLIP_MS } from '../cards/TwoSidedCard';
import type { CardData } from '../../types';
import { rank } from '../../config/rarity';
import { playTone } from '../../utils/sound';
export function CardReveal({
  card,
  onReveal,
  onContinue,
  sound,
}: {
  card: CardData;
  onReveal: () => void;
  onContinue: () => void;
  sound: boolean;
}) {
  const [stage, setStage] = useState<
    'idle' | 'charging' | 'flipping' | 'ready'
  >('idle');
  const reduced = useReducedMotion();
  const locked = useRef(false);
  const latest = useRef({ onReveal, sound });
  latest.current = { onReveal, sound };
  useEffect(() => {
    if (stage !== 'charging' && stage !== 'flipping') return;
    function complete() {
      setStage('ready');
      playTone(latest.current.sound, rank(card.rarity));
      latest.current.onReveal();
    }
    if (reduced) {
      complete();
      return;
    }
    const timer = setTimeout(
      () => (stage === 'charging' ? setStage('flipping') : complete()),
      stage === 'charging' ? 180 : CARD_FLIP_MS,
    );
    return () => clearTimeout(timer);
  }, [stage, reduced, card.rarity]);
  function activate() {
    if (stage === 'ready') {
      onContinue();
      return;
    }
    if (locked.current) return;
    locked.current = true;
    setStage('charging');
  }
  return (
    <div className="normal-reveal" data-stage={stage}>
      <button
        className="reveal-button"
        disabled={stage === 'charging' || stage === 'flipping'}
        onClick={activate}
        aria-label={stage === 'ready' ? 'Continue to next card' : 'Reveal card'}
      >
        <Card
          card={card}
          face={stage === 'idle' || stage === 'charging' ? 'back' : 'front'}
          effectsActive={stage === 'ready'}
        />
      </button>
    </div>
  );
}
