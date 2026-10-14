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
    const characterStyle: CSSProperties = card.artwork.characterTopFade
      ? {
          ...style,
          maskImage: `linear-gradient(to bottom, transparent, #000 ${card.artwork.characterTopFade}%, #000)`,
          WebkitMaskImage: `linear-gradient(to bottom, transparent, #000 ${card.artwork.characterTopFade}%, #000)`,
        }
      : style;
    return (
      <>
        {(['background', 'midground', 'character', 'foreground'] as const).map(
          (layer) =>
            card.artwork?.[layer] && (
              <img
                key={layer}
                className={'hero-artwork-' + layer}
                src={card.artwork[layer]}
                alt={layer === 'character' ? card.name : ''}
                draggable={false}
                style={
                  layer === 'character'
                    ? characterStyle
                    : layer === 'background' &&
                        card.artwork.backgroundBrightness !== undefined
                      ? {
                          filter: `brightness(${card.artwork.backgroundBrightness})`,
                        }
                      : undefined
                }
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
