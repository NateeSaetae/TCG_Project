import type { CSSProperties, ReactNode } from 'react';
import type { CardData } from '../../types';
import {
  useCardPointer,
  type PointerPosition,
} from '../../hooks/useCardPointer';
import { holographicProfile } from '../../config/cardEffects';
import { CardFoil } from './CardFoil';
import './secret-rare.css';

export function SecretRareSurface({
  card,
  small = false,
  preview,
  managedPointer = false,
  information,
  label,
  className,
  hidden = false,
  effectsActive = true,
}: {
  card: Pick<CardData, 'image' | 'imagePosition' | 'artwork'>;
  information: ReactNode;
  label: string;
  className?: string;
  hidden?: boolean;
  effectsActive?: boolean;
  small?: boolean;
  preview?: PointerPosition | null;
  managedPointer?: boolean;
}) {
  const pointer = useCardPointer(preview);
  const layers = card.artwork;
  return (
    <div
      {...(managedPointer ? {} : pointer)}
      className={[
        'sr-card',
        small ? 'small' : '',
        !layers ? 'sr-flat-art' : '',
        ...(className ? [className] : []),
      ].join(' ')}
      style={
        {
          perspective: holographicProfile.perspective,
          '--art-position': card.imagePosition ?? '50% 50%',
        } as CSSProperties
      }
    >
      <div className="sr-body">
        <div className="sr-surface">
          <div
            className="sr-artwork"
            role="img"
            aria-label={hidden ? 'Undiscovered hero' : label}
          >
            {hidden ? null : layers ? (
              (
                ['background', 'midground', 'character', 'foreground'] as const
              ).map(
                (layer) =>
                  layers[layer] && (
                    <img
                      key={layer}
                      className={'sr-layer sr-' + layer}
                      src={layers[layer]}
                      alt=""
                      draggable={false}
                      loading="lazy"
                    />
                  ),
              )
            ) : (
              <img
                className="sr-layer sr-flat-image"
                src={card.image}
                alt=""
                draggable={false}
              />
            )}
          </div>
          <div className="sr-atmosphere" />
          <div className="sr-vignette" />
          <div className="sr-frame" />
        </div>
        <div className="sr-information">{information}</div>
        {!hidden && effectsActive && (
          <>
            <CardFoil />
            <div className="sr-particles" aria-hidden="true">
              {Array.from({ length: 12 }, (_, index) => (
                <i
                  key={index}
                  style={{
                    left: 9 + ((index * 29) % 83) + '%',
                    top: 9 + ((index * 19) % 62) + '%',
                    width: index % 3 === 0 ? 3 : 2,
                    height: index % 3 === 0 ? 3 : 2,
                  }}
                />
              ))}
            </div>
            <div className="sr-glass" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
}
