import { useEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import { CardRenderer } from '../cards/CardRenderer';
import { NewCardBadge } from './NewCardBadge';
import type { HeroCardData } from '../../types/heroCard';
import { rank } from '../../config/rarity';
import { playTone } from '../../utils/sound';
import './stacked-card-reveal.css';

export function StackedCardReveal({
  cards,
  newCards,
  sound,
  onComplete,
}: {
  cards: HeroCardData[];
  newCards: number[];
  sound: boolean;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState(false);
  const gate = useRef(false);
  const cancelled = useRef(false);
  const alive = useRef(true);
  const animation = useRef<ReturnType<typeof animate> | null>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-14, 0, 14]);
  const reduced = useReducedMotion();
  const card = cards[index];
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      animation.current?.stop();
    };
  }, []);
  useEffect(() => {
    playTone(sound, rank(card.rarity));
  }, [index, card.rarity, sound]);
  useEffect(() => {
    if (index === 0) return;
    const timer = setTimeout(
      () => {
        gate.current = false;
        setBusy(false);
      },
      reduced ? 0 : 320,
    );
    return () => clearTimeout(timer);
  }, [index, reduced]);

  async function next(direction = 1) {
    if (gate.current) return;
    gate.current = true;
    setBusy(true);
    setHeld(false);
    animation.current?.stop();
    animation.current = animate(x, reduced ? 0 : direction * 560, {
      duration: reduced ? 0 : 0.3,
      ease: 'easeIn',
    });
    await animation.current;
    if (!alive.current) return;
    if (index === cards.length - 1) {
      onComplete();
      return;
    }
    x.set(0);
    setIndex(index + 1);
    // Keep the newly promoted card locked until its position settles.
  }

  return (
    <div className="stacked-reveal">
      <motion.div
        className="card-stack"
        initial={{ opacity: 0, y: reduced ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.45 }}
      >
        {cards.slice(index + 1).map((behind, offset) => {
          const depth = offset + 1;
          return (
            <motion.div
              key={`${index + depth}-${behind.id}`}
              className="stack-edge"
              aria-hidden="true"
              inert
              style={{ zIndex: cards.length - depth }}
              initial={false}
              animate={{ x: depth * 12, y: depth * -3 }}
              transition={{ duration: reduced ? 0 : 0.3 }}
            >
              <CardRenderer
                card={behind}
                small
                hidden
                managedPointer
                effectsActive={false}
              />
            </motion.div>
          );
        })}
        <motion.div
          key={`${index}-${card.id}`}
          className="stack-card"
          data-held={held}
          style={{ x, rotate: reduced ? 0 : rotate, zIndex: cards.length + 1 }}
          initial={{ y: reduced || index === 0 ? 0 : -3, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
          drag={busy ? false : 'x'}
          dragMomentum={false}
          dragElastic={0.8}
          dragConstraints={{ left: -220, right: 220 }}
          onPointerDownCapture={(event) => {
            if (busy || !event.isPrimary || event.button !== 0) return;
            cancelled.current = false;
            animation.current?.stop();
            setHeld(true);
          }}
          onPointerUpCapture={() => setHeld(false)}
          onPointerCancel={() => {
            cancelled.current = true;
            setHeld(false);
            animation.current = animate(x, 0, { duration: reduced ? 0 : 0.25 });
          }}
          onDragEnd={(_, info) => {
            setHeld(false);
            if (gate.current || cancelled.current) return;
            if (Math.abs(info.offset.x) >= 80)
              void next(info.offset.x < 0 ? -1 : 1);
            else {
              animation.current = animate(x, 0, {
                duration: reduced ? 0 : 0.25,
                ease: 'easeOut',
              });
            }
          }}
        >
          <CardRenderer card={card} small effectsActive />
          {newCards.includes(index) && <NewCardBadge />}
        </motion.div>
      </motion.div>
      <div className="stack-status" role="status" aria-live="polite">
        <span>
          {card.rarity} · {index + 1} / {cards.length}
        </span>
        <small>Drag sideways to reveal the next card</small>
      </div>
      <button
        type="button"
        className="primary stack-next"
        disabled={busy}
        onClick={() => void next()}
      >
        {index === cards.length - 1 ? 'View pack summary' : 'Next Card →'}
      </button>
      <button
        type="button"
        className="text-button"
        disabled={busy}
        onClick={() => {
          if (gate.current) return;
          gate.current = true;
          onComplete();
        }}
      >
        Reveal all →
      </button>
    </div>
  );
}
