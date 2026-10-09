import { useLayoutEffect, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  useCardPointer,
  type PointerPosition,
} from '../../hooks/useCardPointer';
import { holographicProfile } from '../../config/cardEffects';
import { CardBack } from './CardBack';
import { cardBackImage } from '../../config/cardBack';
import './two-sided-card.css';
export type CardFace = 'front' | 'back';
export const CARD_BACK_IMAGE = cardBackImage;
export const CARD_FLIP_MS = 600;
export function TwoSidedCard({
  face,
  children,
  small,
  preview,
  effectsActive = true,
}: {
  face: CardFace;
  children: ReactNode;
  small?: boolean;
  preview?: PointerPosition | null;
  effectsActive?: boolean;
}) {
  const pointer = useCardPointer(preview);
  const reduced = useReducedMotion();
  const [settledFace, setSettledFace] = useState<CardFace | null>(face);
  useLayoutEffect(() => {
    setSettledFace(null);
    if (reduced) {
      setSettledFace(face);
      return;
    }
    const timer = setTimeout(() => setSettledFace(face), CARD_FLIP_MS);
    return () => clearTimeout(timer);
  }, [face, reduced]);
  return (
    <div
      {...pointer}
      className={'two-sided-card sr-card ' + (small ? 'small' : '')}
      style={{ perspective: holographicProfile.perspective }}
      data-face={face}
      data-effects={
        face === 'front' && settledFace === face && effectsActive ? 'on' : 'off'
      }
    >
      <div className="two-tilt">
        <div className="two-rotor">
          <div className="two-face two-front" aria-hidden={face !== 'front'}>
            {children}
          </div>
          <div className="two-face two-back" aria-hidden={face !== 'back'}>
            <CardBack interactive={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
