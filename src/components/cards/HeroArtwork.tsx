import type { CSSProperties } from 'react';
import type { HeroCardData } from '../../types/heroCard';

/** Artwork only: the layout owns cropping, frame, labels and effects. */
export function HeroArtwork({
  card,
  layered = false,
}: {
  card: HeroCardData;
  layered?: boolean;
}) {
  const style = {
    objectPosition: card.imagePosition ?? 'center',
  } as CSSProperties;
  if (layered && card.artwork) {
    return (
      <>
        {(['background', 'midground', 'character', 'foreground'] as const).map(
          (layer) =>
            card.artwork?.[layer] && (
              <img
                key={layer}
                src={card.artwork[layer]}
                alt={layer === 'character' ? card.name : ''}
                draggable={false}
                style={style}
              />
            ),
        )}
      </>
    );
  }
  return (
    <img src={card.image} alt={card.name} draggable={false} style={style} />
  );
}
