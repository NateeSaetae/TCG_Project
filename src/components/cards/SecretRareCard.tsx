import type { CardData } from '../../types';
import type { PointerPosition } from '../../hooks/useCardPointer';
import { SecretRareSurface } from './SecretRareSurface';

/** Aether keeps its existing information and shared full-art finishing. */
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
  return (
    <SecretRareSurface
      card={card}
      label={card.character}
      small={small}
      preview={preview}
      managedPointer={managedPointer}
      information={
        <>
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
        </>
      }
    />
  );
}
