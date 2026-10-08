import type { CSSProperties } from 'react';
import type { CardData } from '../../types';
import {
  useCardPointer,
  type PointerPosition,
} from '../../hooks/useCardPointer';
import { holographicProfile } from '../../config/cardEffects';
import { CardFoil } from './CardFoil';
import './secret-rare.css';

export function SecretRareCard({
  card,
  small = false,
  preview,
  managedPointer = false,
}: {
  card: CardData;
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
          <div className="sr-artwork" role="img" aria-label={card.character}>
            {layers ? (
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
        <div className="sr-information">
          <div className="card-top">
            <span>{card.cost}</span>
            <span>{card.element} ✧</span>
          </div>
          <div className="card-copy">
            <div className="card-rarity">✧ SECRET RARE · {card.cardType}</div>
            <h3>{card.name}</h3>
            <p>{card.description}</p>
            <div className="card-stats">
              <span>⚔ {card.attack}</span>
              <span>◇ {card.defense}</span>
            </div>
            <footer>
              <span>AWAKENING · EN</span>
              <span>{String(card.cardNumber).padStart(3, '0')} / 030</span>
            </footer>
          </div>
        </div>
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
      </div>
    </div>
  );
}
