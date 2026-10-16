import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
  const dragged = useRef(false);
  const alive = useRef(true);
  const animation = useRef<ReturnType<typeof animate> | null>(null);
  const tiltX = useMotionValue(0);
  const exitX = useMotionValue(0);
  const rotate = useTransform(tiltX, [-220, 0, 220], [-11, 0, 11]);
  const rotateY = useTransform(tiltX, [-220, 0, 220], [-14, 0, 14]);
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
    const exitDistance =
      typeof window === 'undefined' ? 600 : window.innerWidth / 2 + 320;
    animation.current = animate(
      exitX,
      reduced ? 0 : direction * exitDistance,
      {
        duration: reduced ? 0 : 0.22,
        ease: 'easeIn',
      },
    );
    await animation.current;
    if (!alive.current) return;
    if (index === cards.length - 1) {
      onComplete();
      return;
    }
    flushSync(() => setIndex(index + 1));
    exitX.set(0);
    tiltX.set(0);
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
        {cards.slice(index + 1).map((behind, offset) => (
          <div
            key={`${index + offset + 1}-${behind.id}`}
            className="stack-preview"
            aria-hidden="true"
            inert
            style={{ zIndex: cards.length - offset - 1 }}
          >
            <CardRenderer
              card={behind}
              small
              managedPointer
              effectsActive={false}
            />
          </div>
        ))}
        <motion.div
          key={`${index}-${card.id}`}
          className="stack-card"
          data-held={held}
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-label={
            index === cards.length - 1
              ? `View pack summary after ${card.name}`
              : `Drag to reveal next card after ${card.name}`
          }
          style={{
            x: exitX,
            rotate: reduced ? 0 : rotate,
            rotateY: reduced ? 0 : rotateY,
            transformPerspective: 900,
            zIndex: cards.length + 1,
          }}
          initial={{ y: reduced || index === 0 ? 0 : -3, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
          onPointerDownCapture={(event) => {
            if (busy || !event.isPrimary || event.button !== 0) return;
            cancelled.current = false;
            dragged.current = false;
            animation.current?.stop();
            setHeld(true);
          }}
          onClick={() => {
            if (
              index === cards.length - 1 &&
              !dragged.current &&
              !cancelled.current
            )
              void next();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              void next();
            }
          }}
          onPointerUpCapture={() => setHeld(false)}
          onPointerCancel={() => {
            cancelled.current = true;
            setHeld(false);
            animation.current = animate(tiltX, 0, {
              duration: reduced ? 0 : 0.25,
            });
          }}
          onPanStart={() => {
            dragged.current = true;
          }}
          onPan={(_, info) => {
            if (gate.current || cancelled.current) return;
            animation.current?.stop();
            tiltX.set(Math.max(-220, Math.min(220, info.offset.x)));
          }}
          onPanEnd={(_, info) => {
            setHeld(false);
            if (gate.current || cancelled.current) return;
            if (Math.abs(info.offset.x) >= 80)
              void next(info.offset.x < 0 ? -1 : 1);
            else {
              animation.current = animate(tiltX, 0, {
                duration: reduced ? 0 : 0.25,
                ease: 'easeOut',
              });
            }
          }}
        >
          <CardRenderer
            card={card}
            small
            managedPointer={newCards.includes(index)}
            effectsActive
          />
          {newCards.includes(index) && <NewCardBadge />}
        </motion.div>
      </motion.div>
      <div className="stack-status" role="status" aria-live="polite">
        <span>
          {card.rarity} · {index + 1} / {cards.length}
        </span>
        <small>
          {index === cards.length - 1
            ? 'Click or drag this card to view your pack'
            : 'Hold and drag sideways to reveal the next card'}
        </small>
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
